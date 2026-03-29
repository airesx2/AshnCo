// vision-gesture/events.js

export function emitCommand(action) { //importable in recognition.js
    if (typeof chrome !== 'undefined' && chrome.runtime){
        chrome.runtime.sendMessage({ type: 'GESTURE', action})
    }
    else {
        document.dispatchEvent(new CustomEvent('gesture-command', {detail: {action}}))
    }
    
}
