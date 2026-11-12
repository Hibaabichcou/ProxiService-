import "dotenv/config";
import OpenAI from "openai";
import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";

const config = loadConfig();
const openaiClient = config.openaiApiKey
  ? new OpenAI({
    apiKey: config.openaiApiKey,
    maxRetries: 1,
    timeout: 30_000,
  })
  : null;
const app = createApp(config, { openaiClient });

app.listen(config.port, () => {
  console.log(`ProxiService API listening on port ${config.port} (${config.nodeEnv}).`);
});
