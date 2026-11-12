import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { createAiRouter } from "./routes/ai.js";
import healthRouter from "./routes/health.js";
import { AppError } from "./utils/appError.js";

export function createApp(config, { openaiClient = null } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError("Origin not allowed by CORS.", 403));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    optionsSuccessStatus: 204,
  }));
  app.use(express.json({ limit: "10kb", strict: true }));

  const apiRouter = express.Router();
  apiRouter.use(rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_request, response) {
      response.status(429).json({
        error: { message: "Too many requests. Please try again later." },
      });
    },
  }));
  apiRouter.use(createAiRouter({ config, openaiClient }));
  apiRouter.use(healthRouter);
  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
