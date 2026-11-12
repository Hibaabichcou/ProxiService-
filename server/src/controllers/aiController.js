import { randomUUID } from "node:crypto";
import { AppError } from "../utils/appError.js";
import { validateChatMessages } from "../services/ai/chatService.js";

const SAFE_PROVIDER_ERROR_TYPES = new Set([
  "invalid_request_error",
  "authentication_error",
  "rate_limit_error",
  "server_error",
  "insufficient_quota",
  "billing_hard_limit_reached",
  "permission_error",
  "not_found_error",
  "unprocessable_entity_error",
  "conflict_error",
  "APIError",
  "APIConnectionError",
  "APIConnectionTimeoutError",
  "APIUserAbortError",
  "AuthenticationError",
  "BadRequestError",
  "ConflictError",
  "InternalServerError",
  "NotFoundError",
  "PermissionDeniedError",
  "RateLimitError",
  "UnprocessableEntityError",
]);

function getSafeProviderErrorType(error) {
  if (SAFE_PROVIDER_ERROR_TYPES.has(error?.type)) return error.type;
  if (SAFE_PROVIDER_ERROR_TYPES.has(error?.name)) return error.name;
  return "unknown";
}

function getSafeProviderStatus(error) {
  return Number.isInteger(error?.status) && error.status >= 100 && error.status <= 599
    ? error.status
    : "unknown";
}

function logProviderDiagnostic(level, diagnostic) {
  console[level](JSON.stringify(diagnostic));
}

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
        logProviderDiagnostic("warn", {
          event: "ai_provider_empty_response",
          requestId,
          upstreamStatus: 200,
          providerErrorType: "empty_output",
        });
        const error = new AppError("The AI provider returned no output.", 502);
        error.requestId = requestId;
        next(error);
        return;
      }

      response.json({ reply, requestId });
    } catch (error) {
      logProviderDiagnostic("error", {
        event: "ai_provider_request_failed",
        requestId,
        upstreamStatus: getSafeProviderStatus(error),
        providerErrorType: getSafeProviderErrorType(error),
      });
      const safeError = new AppError("AI provider request failed.", 502);
      safeError.requestId = requestId;
      next(safeError);
    }
  };
}
