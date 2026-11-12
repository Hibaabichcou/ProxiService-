export function createOpenAiProvider(client) {
  return {
    async generateResponse({ model, instructions, input, maxOutputTokens }) {
      const response = await client.responses.create({
        model,
        instructions,
        input,
        max_output_tokens: maxOutputTokens,
      });

      return response.output_text?.trim() || "";
    },
  };
}
