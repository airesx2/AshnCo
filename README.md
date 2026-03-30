# HandsFree

> Control Twitter/X with nothing but your hands.

HandsFree is a Chrome extension that uses your webcam and MediaPipe to detect hand gestures in real time and translate them into Twitter actions — no keyboard, no mouse, no touch required.

Built at a hackathon by AshnCo.

---

## Gestures

| Gesture | On Feed | On Compose Page |
|---|---|---|
| 👍 Thumbs up | Like the centered post | Submit draft (with audio confirmation) |
| ✌️ Peace sign | Open compose page | Return to For You feed |
| 🤙 Shaka | Scroll to next post + read it aloud | — |
| 🖐 Open palm | Read current post aloud / stop reading | — |

---

## Setup

### Requirements
- Node.js + npm
- Google Chrome

### 1. Build the extension

```bash
cd frontend-extension
npm install
npm run build
```

### 2. Load into Chrome

- Go to `chrome://extensions`
- Enable **Developer Mode** (top right toggle)
- Click **Load unpacked**
- Select the `frontend-extension/dist` folder

### 3. Connect gesture page to extension

- In `chrome://extensions`, copy the **ID** shown under HandsFree
- Open `frontend-extension/vision-gesture/events.js`
- Paste it in:

```js
const EXTENSION_ID = 'your-extension-id-here'
```

### 4. Start the gesture page

```bash
cd frontend-extension/vision-gesture
npx serve .
```

Or use the hosted version: **[vision-gesture.vercel.app](https://vision-gesture.vercel.app)**

### 5. Use it

- Open [x.com](https://x.com) and the gesture page side by side
- Click the HandsFree extension icon on the Twitter tab
- Allow **camera and microphone** permissions when prompted
- Start gesturing

---

## How It Works

```
Webcam → MediaPipe Hands → Gesture Classifier → Chrome Extension → Twitter DOM
```

- Gesture detection runs on a hosted page (Vercel) to bypass Chrome MV3 CSP restrictions on WebAssembly
- Detected gestures are sent to the extension via `chrome.runtime.sendMessage` using `externally_connectable`
- The background service worker routes commands to the Twitter content script
- The content script performs actions directly on Twitter's DOM
- Audio feedback via Chrome TTS API
- Tweet dictation via Web Speech API

---

## Tech Stack

- **MediaPipe Hands** — real-time hand landmark detection
- **Chrome Extension Manifest V3** — content scripts, service worker, side panel
- **Vite + CRXJS** — extension bundler
- **Web Speech API** — speech-to-text
- **Chrome TTS API** — text-to-speech
- **Vercel** — gesture page hosting

---

## Project Structure

```
frontend-extension/
├── src/
│   ├── background/     # Service worker — routes gestures to Twitter
│   ├── content/        # Content script — performs actions on Twitter DOM
│   └── sidepanel/      # Extension side panel UI
├── vision-gesture/
│   ├── camera.js       # Webcam setup + MediaPipe feed
│   ├── recognition.js  # Gesture classification from landmarks
│   ├── events.js       # Sends gestures to extension
│   └── index.html      # Hosted gesture page
└── manifest.json
```
