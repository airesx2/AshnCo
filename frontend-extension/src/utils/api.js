// Stub implementations — replace BASE_URL and uncomment fetch calls when P2's backend is ready
const BASE_URL = 'http://localhost:3000'

// Sends voice transcript to P2's LLM, returns { tweetText, hashtags }
export async function generateTweet(transcript) {
  console.log('[AshnCo] generateTweet ->', transcript)

  // return await fetch(`${BASE_URL}/generate`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ transcript })
  // }).then(r => r.json())

  // Stub
  return {
    tweetText: `Draft: ${transcript}`,
    hashtags: [],
  }
}

// Sends text to P2's TTS to be spoken aloud
export async function readAloud(text) {
  console.log('[AshnCo] readAloud ->', text)

  // return await fetch(`${BASE_URL}/tts`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ text })
  // }).then(r => r.json())

  // Stub — use browser TTS as fallback until P2 is ready
  const utterance = new SpeechSynthesisUtterance(text)
  speechSynthesis.speak(utterance)
}
