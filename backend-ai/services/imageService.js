const OpenAI = require("openai");
const { IMAGE_SUGGESTION_PROMPT } = require("../llm/prompts");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildFallbackImages(description) {
  return {
    imageSuggestions: [
      `${description} social media post`,
      `${description} accessibility technology`,
      `${description} team collaboration`,
    ],
    fallback: true,
  };
}

async function suggestImages(description) {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: IMAGE_SUGGESTION_PROMPT,
        },
        {
          role: "user",
          content: `Description: ${description}`,
        },
      ],
    });

    const outputText = response.output_text;
    return JSON.parse(outputText);
  } catch (error) {
    console.error("imageService suggestImages error:", error);

    return buildFallbackImages(description);
  }
}

module.exports = {
  suggestImages,
};