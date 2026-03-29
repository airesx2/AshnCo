# Speech Plan

## Speech-to-Text
Use browser Web Speech API on the frontend.

Recommended:
- webkitSpeechRecognition for Chrome-based browsers

Flow:
1. User clicks "Start Voice Input"
2. Browser captures speech
3. Browser converts speech to text
4. Frontend sends raw text to backend `/api/ai/clean-tweet`

## Text-to-Speech
Use browser SpeechSynthesis API on the frontend.

Flow:
1. Frontend receives tweet text
2. Frontend calls speechSynthesis.speak()
3. Tweet is read aloud to user