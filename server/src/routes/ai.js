import { Router } from "express";
import { createChatController } from "../controllers/aiController.js";
import { createChatService } from "../services/ai/chatService.js";
import { createOpenAiProvider } from "../providers/openAiProvider.js";

export function createAiRouter({ config, openaiClient }) {
  const router = Router();
  const chatService = openaiClient
    ? createChatService(createOpenAiProvider(openaiClient), config.openaiModel)
    : null;

  router.post("/chat", createChatController({ config, chatService }));
  return router;
}
