const btn = document.getElementById('help-btn')
const btnIcon = document.getElementById('btn-icon')

const INSTRUCTIONS = [
  'Welcome to AshnCo. Control Twitter hands-free using these gestures.',
  'Thumbs up: like the current post. On the compose page, thumbs up submits your draft — you will be asked to confirm.',
  'Peace sign: open the compose page. On the compose page, peace sign returns you to the feed.',
  'Shaka sign: scroll to the next post.',
  'Open palm: read the current post aloud.',
  'Make sure your hand is clearly visible to the camera on the test page to use gestures.'
].join(' ')

btn.addEventListener('click', () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel()
    btn.classList.remove('speaking')
    btnIcon.textContent = '🔊'
    return
  }

  const utt = new SpeechSynthesisUtterance(INSTRUCTIONS)
  utt.rate = 0.95

  utt.onstart = () => {
    btn.classList.add('speaking')
    btnIcon.textContent = '⏹'
  }

  utt.onend = () => {
    btn.classList.remove('speaking')
    btnIcon.textContent = '🔊'
  }

  speechSynthesis.speak(utt)
})
