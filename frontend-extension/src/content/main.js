
let lastUrl = location.href
let composeBox = null
let composeObserver = null
let postConfirmPending = false
let postConfirmTimer = null
let postSpeaking = false
let autoReadEnabled = true
let lastReadPostId = null
let scrollDebounceTimer = null
let currentContext = 'feed'

function speak(text) {
  chrome.runtime.sendMessage({ type: 'SPEAK', text })
}

function clickPostButton() {
  const btn = document.querySelector('[data-testid="tweetButtonInline"]') ||
              document.querySelector('[data-testid="tweetButton"]')
  if (btn) btn.click()
}

// ── Auto-read on scroll ─────────────────────────────────────────────────────

function getVisiblePost() {
  if (currentContext === 'composing') return null
  const posts = [...document.querySelectorAll('article[data-testid="tweet"]')]
  const centerY = window.innerHeight / 2
  let centerPost = null
  let minDistance = Infinity
  posts.forEach(post => {
    const rect = post.getBoundingClientRect()
    const postCenterY = rect.top + rect.height / 2
    const distance = Math.abs(postCenterY - centerY)
    if (rect.bottom > window.innerHeight * 0.2 && rect.top < window.innerHeight * 0.8) {
      if (distance < minDistance) {
        minDistance = distance
        centerPost = post
      }
    }
  })
  return centerPost
}

function autoReadCurrentPost() {
  if (!autoReadEnabled || postSpeaking) return
  const post = getVisiblePost()
  if (!post) return
  const postId = post.getAttribute('data-testid') || post.textContent.substring(0, 50)
  if (postId !== lastReadPostId) {
    lastReadPostId = postId
    const postText = post.querySelector('[data-testid="tweetText"]')
    if (postText) {
      chrome.runtime.sendMessage({ type: 'TTS', text: postText.innerText })
    }
  }
}

function setupAutoRead() {
  window.addEventListener('scroll', () => {
    clearTimeout(scrollDebounceTimer)
    scrollDebounceTimer = setTimeout(() => {
      autoReadCurrentPost()
    }, 300)
  }, { passive: true })
}

// ── One-time init ────────────────────────────────────────────────────────────

function onceInit() {
  setupCamera()
}

function setupCamera() {
  const host = document.createElement('div')
  host.id = 'ashn-camera-host'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .wrap {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 2147483647;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        width: 160px;
        aspect-ratio: 4/3;
        background: #111;
      }
      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transform: scaleX(-1);
      }
    </style>
    <div class="wrap">
      <video id="ashn-camera" autoplay playsinline muted></video>
    </div>
  `

  const video = shadow.getElementById('ashn-camera')

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream
    })
    .catch(err => console.error('[AshnCo] Camera error:', err.name, '-', err.message))
}

// ── Context tracking ─────────────────────────────────────────────────────────

function setContext(context) {
  currentContext = context
  chrome.runtime.sendMessage({ type: 'CONTEXT', context })
}

// ── Compose box detection ────────────────────────────────────────────────────

function findComposeBox() {
  return document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]')
}

function composeBoxReady(el) {
  composeBox = el
  setContext('composing')
  el.addEventListener('blur',  () => setContext('feed'))
  el.addEventListener('focus', () => setContext('composing'))
}

function startSTT() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return
  speak('listening')
  const recognition = new SR()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript
    if (composeBox) {
      composeBox.focus()
      document.execCommand('insertText', false, transcript)
    }
  }
  recognition.onerror = () => speak('microphone not available')
  recognition.start()
}

function watchForComposeBox() {
  const el = findComposeBox()
  if (el) { composeBoxReady(el); return }

  composeObserver = new MutationObserver(() => {
    const el = findComposeBox()
    if (el) {
      composeObserver.disconnect()
      composeObserver = null
      composeBoxReady(el)
    }
  })
  composeObserver.observe(document.body, { childList: true, subtree: true })
}

// ── Command listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'LIKE_POST': {
      // if waiting for post confirmation, treat this as the confirm
      if (postConfirmPending) {
        clearTimeout(postConfirmTimer)
        postConfirmPending = false
        clickPostButton()
        break
      }
      const posts = [...document.querySelectorAll('article[data-testid="tweet"]')]
      const center = window.innerHeight / 2
      const closest = posts.reduce((best, post) => {
        const rect = post.getBoundingClientRect()
        const dist = Math.abs(rect.top + rect.height / 2 - center)
        return !best || dist < best.dist ? { post, dist } : best
      }, null)
      if (closest) {
        const likeBtn = closest.post.querySelector('[data-testid="like"]')
        if (likeBtn) likeBtn.click()
      }
      break
    }

    case 'POST_DRAFT': {
      if (postSpeaking) break
      if (!postConfirmPending) {
        postSpeaking = true
        // safety: reset if SPEAK_DONE never arrives
        setTimeout(() => { postSpeaking = false }, 6000)
        speak('thumbs up again to post')
      } else {
        clearTimeout(postConfirmTimer)
        postConfirmPending = false
        clickPostButton()
      }
      break
    }

    case 'SPEAK_DONE':
      postSpeaking = false
      postConfirmPending = true
      postConfirmTimer = setTimeout(() => { postConfirmPending = false }, 3000)
      break

    case 'GOTO_FEED':
      speak('redirecting to home page')
      window.location.href = 'https://twitter.com/home'
      break

    case 'OPEN_COMPOSE':
      speak('redirecting to post compose page')
      window.location.href = 'https://twitter.com/compose/post'

      // TODO task 5: trigger voice input after compose opens
      break

    case 'NEXT_POST': {
      const posts = [...document.querySelectorAll('article[data-testid="tweet"]')]
      const center = window.innerHeight / 2
      const nextPost = posts.find(post => post.getBoundingClientRect().top > center + 10)
      if (nextPost) nextPost.scrollIntoView({ behavior: 'smooth', block: 'center' })
      break
    }

    case 'READ_ALOUD': {
      const post = document.querySelector('[data-testid="tweetText"]')
      if (post) chrome.runtime.sendMessage({ type: 'TTS', text: post.innerText })
      break
    }

    case 'SPEAK':
      speechSynthesis.cancel()
      speechSynthesis.speak(new SpeechSynthesisUtterance(message.text))
      break

    case 'FILL_COMPOSE':
      if (composeBox && message.text) {
        console.log('[AshnCo] Fill compose with', message.text)
        // TODO task 7: full React-compatible autofill
      }
      break

    case 'TOGGLE_AUTO_READ':
      autoReadEnabled = message.enabled
      console.log('[AshnCo] Auto-read:', autoReadEnabled ? 'enabled' : 'disabled')
      break
  }
})

// ── Per-page init ────────────────────────────────────────────────────────────

function pageInit() {
  if (composeObserver) {
    composeObserver.disconnect()
    composeObserver = null
  }
  composeBox = null
  setContext('feed')
  watchForComposeBox()
  if (location.href.includes('/compose')) {
    setTimeout(startSTT, 1500)
  }
}

// ── SPA navigation observer ──────────────────────────────────────────────────

const navObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    pageInit()
  }
})

navObserver.observe(document.body, { childList: true, subtree: true })

// camera starts immediately, gesture detection runs via test.html on localhost
onceInit()
pageInit()
setupAutoRead()
