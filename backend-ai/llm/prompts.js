const CLEAN_TWEET_PROMPT = `
Return ONLY valid JSON.
Do not include markdown.
Do not include triple backticks.
Do not include any explanation.

Format exactly like this:
{
  "tweetText": "cleaned tweet here",
  "hashtags": ["#tag1", "#tag2"]
}

Task:
Clean up the user's raw spoken text into a concise Twitter/X post.
Preserve meaning.
Add 2 to 4 relevant hashtags.
`;

const IMAGE_SUGGESTION_PROMPT = `
Return ONLY valid JSON.
Do not include markdown.
Do not include triple backticks.
Do not include any explanation.

Format exactly like this:
{
  "imageSuggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ]
}

Task:
Given a post description, suggest 3 short image ideas or search terms that match the post.
`;

module.exports = {
  CLEAN_TWEET_PROMPT,
  IMAGE_SUGGESTION_PROMPT,
};