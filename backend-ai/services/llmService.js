const OpenAI = require("openai");
const { CLEAN_TWEET_PROMPT } = require("../llm/prompts");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildFallbackTweet(rawText) {
  const trimmed = rawText.trim();

  let cleaned = trimmed;

  if (cleaned.length > 180) {
    cleaned = cleaned.slice(0, 177) + "...";
  }

  return {
    tweetText: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
    hashtags: ["#Accessibility", "#Hackathon", "#InclusiveTech"],
    fallback: true,
  };
}

async function cleanTweetText(rawText) {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: CLEAN_TWEET_PROMPT,
        },
        {
          role: "user",
          content: `Raw text: ${rawText}`,
        },
      ],
    });

    const outputText = response.output_text;
    return JSON.parse(outputText);
  } catch (error) {
    console.error("llmService cleanTweetText error:", error);

    return buildFallbackTweet(rawText);
  }
}

module.exports = {
  cleanTweetText,
};