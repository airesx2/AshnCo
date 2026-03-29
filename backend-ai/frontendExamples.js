async function cleanTweet(rawText) {
  const response = await fetch("http://localhost:5001/api/ai/clean-tweet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rawText }),
  });

  return response.json();
}

async function getImageSuggestions(description) {
  const response = await fetch("http://localhost:5001/api/ai/suggest-images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description }),
  });

  return response.json();
}