// vision-gesture/events.js
const EXTENSION_ID = 'ianokamihakgmnclhjhimnpfdnambccd' 

export function emitCommand(action) {
  // always update local display
  document.dispatchEvent(new CustomEvent('gesture-command', { detail: { action } }))
  // also send to extension if chrome is available
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage(EXTENSION_ID, { type: 'GESTURE', action })
  }
}
