# Copilot Instructions for AshnCo Codebase

## Project Overview

**AshnCo** is a Chrome extension enabling hands-free Twitter/X control through gesture recognition and voice input. It combines real-time hand tracking (MediaPipe) with browser gesture classification and backend AI services.

### Architecture: Two-Part System

1. **Frontend Extension** (`frontend-extension/`) – Chrome extension with gesture UI
2. **Backend AI** (`backend-ai/`) – Node.js/Express service for LLM text processing

Communication flows:
- Content script (Twitter page) ↔ Background service worker ↔ Side panel UI
- Front-end gesture events → External localhost connection → Background worker → Content script commands
- Voice input → Backend AI (`/api/ai/clean-tweet`) → Text formatting

## Critical Workflows

### Local Development Setup

```bash
# Terminal 1: Backend AI
cd backend-ai && npm run dev

# Terminal 2: Frontend extension  
cd frontend-extension && npm run dev

# Terminal 3: Gesture testing (vision-gesture)
cd frontend-extension/vision-gesture && npx serve .

# Chrome: Load unpacked extension from frontend-extension/dist
# Visit: http://localhost:3000 + x.com side-by-side
```

**Key**: The extension REQUIRES `externally_connectable` to localhost (see `manifest.json` L29–31) to receive gesture events from the test page.

### Building & Deployment

- Frontend: `npm run build` generates `dist/` (Chrome extension ready)
- Backend: No build step; runs directly with `npm start`
- **Change extension ID in** [vision-gesture/events.js#L1](vision-gesture/events.js#L1) to match your extension

## Project-Specific Patterns

### Gesture Classification Pipeline

Gestures are classified by hand landmark positions (MediaPipe output):

```js
// vision-gesture/recognition.js
isThumbsUp(lm)      // lm[4].y < lm[3].y && other fingers curled
isOpenPalm(lm)      // all four fingers extended
isPeaceSign(lm)     // index & middle extended, ring & pinky curled  
isSix(lm)           // thumb + pinky out, middle fingers curled
```

Debounced at 800ms (L6) to prevent gesture spam. Update `DEBOUNCE_MS` if gesture latency is an issue.

### Fingerspell Recognition (Dollar Recognizer)

[dollar.js](frontend-extension/vision-gesture/dollar.js) implements the $1 Unistroke algorithm (Wobbrock et al. 2007) for stroke-based letter recognition. Triggered when index fingertip traces: strokes are accumulated until 1s pause (L21 `PAUSE_MS`), then matched against 16 built-in letter templates (0.6 confidence threshold, L46).

### Message Routing: Content Script → Background Worker

[src/background/index.js](frontend-extension/src/background/index.js) routes gestures based on **context** (`'feed'` or `'composing'`):

```js
case 'like':
  isComposing ? sendToContent(tabId, { type: 'POST_DRAFT' }) 
              : sendToContent(tabId, { type: 'LIKE_POST' })
```

Context is set by content script when compose box gains/loses focus (L37–40 [src/content/main.js](frontend-extension/src/content/main.js)).

### API Stubs → Backend Integration

[src/utils/api.js](frontend-extension/src/utils/api.js) defines `generateTweet(transcript)` and `readAloud(text)` as stubs. Uncomment fetch calls when backend is ready. Backend endpoint: `POST /api/ai/clean-tweet` (see [backend-ai/routes/aiRoutes.js](backend-ai/routes/aiRoutes.js#L7–18)).

### Chrome Extension Messaging

- **Internal**: `chrome.runtime.onMessage` (content script ↔ background worker, same extension)
- **External**: `chrome.runtime.onMessageExternal` (localhost test page → background worker, requires `externally_connectable` in manifest)
- **Tabs**: `chrome.tabs.sendMessage(tabId, { type: 'LIKE_POST' })` sends message to specific tab

See [src/background/index.js#L16–42](frontend-extension/src/background/index.js#L16-L42) for full routing.

### Compose Box Detection

Content script tracks Twitter's compose box via `MutationObserver` (L59–75 [src/content/main.js](frontend-extension/src/content/main.js)). Selector: `[data-testid="tweetTextarea_0"] [contenteditable="true"]`. Update if Twitter/X changes DOM structure.

### Auto-Read Posts While Scrolling

When enabled via the side panel toggle, the content script automatically reads aloud the post closest to the center of the viewport as users scroll. Implementation:

- **Scroll listener** (300ms debounce) calls `getVisiblePost()` to find centermost post
- **Post tracking** prevents re-reading the same post (compares `lastReadPostId`)
- **Context-aware** – disabled during compose mode
- **Pausable** via side panel button, sends `TOGGLE_AUTO_READ` message to all Twitter tabs
- Located in [src/content/main.js#L17–68](frontend-extension/src/content/main.js#L17-L68)

## Integration Points & Dependencies

### MediaPipe Hands

- **Version**: Loaded via CDN (`https://cdn.jsdelivr.net/npm/@mediapipe/hands/`)
- **Landmarks**: 21-point hand skeleton; index 8 = fingertip, 6 = knuckle (used in gesture classification)
- **Frame rate**: ~30fps (camera resolution 640×480, see [vision-gesture/camera.js#L13–17](frontend-extension/vision-gesture/camera.js#L13-L17))

### OpenAI API (Backend)

- **Model**: `gpt-4.1-mini` (typo in [services/llmService.js#L19](backend-ai/services/llmService.js#L19)? Should verify actual model exists)
- **Fallback**: If API fails, returns hardcoded hashtags + truncated text (L6–15)
- **Prompt system**: Located in [llm/prompts.js](backend-ai/llm/prompts.js); returns JSON only

### Browser APIs

- `SpeechSynthesis` for TTS (fallback in [src/utils/api.js#L22](frontend-extension/src/utils/api.js#L22), primary via Chrome's native TTS in [src/background/index.js#L76–83](frontend-extension/src/background/index.js#L76-L83))
- `navigator.mediaDevices.getUserMedia()` for camera access
- `MutationObserver` for DOM changes (Twitter's SPA navigation)

## Key Files by Feature

| Feature | Files |
|---------|-------|
| Gesture recognition | [vision-gesture/recognition.js](frontend-extension/vision-gesture/recognition.js), [dollar.js](frontend-extension/vision-gesture/dollar.js) |
| Hand tracking | [vision-gesture/camera.js](frontend-extension/vision-gesture/camera.js) |
| Twitter commands | [src/content/main.js](frontend-extension/src/content/main.js) (L83–153 for command handlers) |
| Message routing | [src/background/index.js](frontend-extension/src/background/index.js) |
| LLM integration | [backend-ai/services/llmService.js](backend-ai/services/llmService.js), [routes/aiRoutes.js](backend-ai/routes/aiRoutes.js) |
| Side panel UI | [src/sidepanel/](frontend-extension/src/sidepanel/) |
| Auto-read posts | [src/content/main.js#L17–68](frontend-extension/src/content/main.js#L17-L68) |

## Common Tasks

### Add a New Gesture

1. Define classifier in [vision-gesture/recognition.js](frontend-extension/vision-gesture/recognition.js#L26-L34)
2. Add case in [src/background/index.js#L91–117](frontend-extension/src/background/index.js#L91-L117) `handleGesture()`
3. Add command handler in [src/content/main.js#L83–153](frontend-extension/src/content/main.js#L83-L153) `chrome.runtime.onMessage`

### Extend Fingerspell (Add Letters)

Add unistroke template to [dollar.js#L92–141](frontend-extension/vision-gesture/dollar.js#L92-L141) `Unistrokes` array. Use $1 recognizer training tool to capture strokes.

### Test Gesture Locally

Use [vision-gesture/test.html](frontend-extension/vision-gesture/test.html) with `npx serve .`, adjust gesture confidence threshold in [recognition.js#L45](frontend-extension/vision-gesture/recognition.js#L45) if needed.

### Change Twitter/X Selectors

Update all `data-testid` references in [src/content/main.js](frontend-extension/src/content/main.js) if Twitter's DOM changes (happens frequently).

### Adjust Auto-Read Behavior

- **Scroll debounce**: Change `300` in [setupAutoRead()](frontend-extension/src/content/main.js#L62) to read faster/slower
- **Visibility threshold**: Adjust `0.2` and `0.8` in `getVisiblePost()` (L30–31) to change which posts count as "visible"
- **Center detection**: Modify centerline calculation (L26) to bias towards top/bottom of viewport

## Gotchas & Conventions

- **Extension ID**: Hard-coded in [events.js#L1](frontend-extension/vision-gesture/events.js#L1); must match deployed extension
- **LLM model name**: "gpt-4.1-mini" in [llmService.js#L19](backend-ai/services/llmService.js#L19) may not exist; verify against OpenAI API
- **Gesture debounce**: 800ms throttle prevents jitter but may feel slow; adjust `DEBOUNCE_MS` if UX needs improvement
- **CSS variables**: Dark mode theming uses CSS custom properties in [src/style.css](frontend-extension/src/style.css) and [sidepanel/style.css](frontend-extension/src/sidepanel/style.css); update both for consistency
- **Credentials**: [src/utils/credentials.js](frontend-extension/src/utils/credentials.js) is gitignored; create locally with Twitter API keys
- **Fallback UX**: If backend fails, draft text is automatically truncated + generic hashtags applied; users always get *something*
- **Auto-read post ID**: Uses `data-testid` attr or first 50 chars of post text; Twitter's DOM changes may invalidate these IDs

## Code Style Notes

- Frontend: ES modules, Vite bundling, no strict semicolons enforced
- Backend: CommonJS (`require`), Express routing pattern
- Use `async/await` for Promises; avoid `.then()` chains where possible
- Console logging: Prefix with `[AshnCo]` or `[AshnCo SW]` for identification
- Event listeners: Use `{ passive: true }` for scroll/wheel listeners to improve performance

## When Stuck

1. **Gesture not firing?** Check debounce timer & gesture confidence thresholds in [recognition.js](frontend-extension/vision-gesture/recognition.js#L45)
2. **Twitter commands not working?** Verify `data-testid` selectors in [content/main.js](frontend-extension/src/content/main.js) match current Twitter DOM
3. **Backend 500 error?** Check `OPENAI_API_KEY` in `.env` and LLM model name
4. **Extension not loading?** Ensure `dist/` folder exists; rebuild with `npm run build`
5. **Localhost gesture events not received?** Verify `externally_connectable` in [manifest.json](frontend-extension/manifest.json) and extension ID in [events.js](frontend-extension/vision-gesture/events.js)
6. **Auto-read not working?** Verify scroll listener is attached (`setupAutoRead()` must be called), check browser console for selector errors, ensure TTS message routing works in background worker
