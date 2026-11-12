import { randomUUID } from "node:crypto";
import { AppError } from "../utils/appError.js";
import { validateChatMessages } from "../services/ai/chatService.js";

export function createChatController({ config, chatService }) {
  return async function postChat(request, response, next) {
    const requestId = randomUUID();
    const validation = validateChatMessages(request.body);
    if (validation.error) {
      response.status(400).json({ error: validation.error, requestId });
      return;
    }

    if (!config.openaiApiKey || !chatService) {
      response.status(503).json({
        error: "Le service ProxiBot n'est pas configuré côté serveur.",
        requestId,
      });
      return;
    }

    try {
      const reply = await chatService.reply(validation.messages);
      if (!reply) {
        const error = new AppError("The AI provider returned no output.", 502);
        error.requestId = requestId;
        next(error);
        return;
      }

      response.json({ reply, requestId });
    } catch (error) {
      const upstreamStatus = Number.isInteger(error?.status) ? error.status : "unknown";
      console.error(`AI provider request failed (${requestId}, status: ${upstreamStatus}).`);
      const safeError = new AppError("AI provider request failed.", 502);
      safeError.requestId = requestId;
      next(safeError);
    }
  };
}
