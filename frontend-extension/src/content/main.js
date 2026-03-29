let lastUrl = location.href

function inject() {
  if (document.body.dataset.ashnInjected) return
  document.body.dataset.ashnInjected = 'true'

  console.log('[AshnCo] Content script injected on', location.href)
  // Future: mount UI, attach listeners to Twitter compose box, etc.
}

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    delete document.body.dataset.ashnInjected
    inject()
  }
})

observer.observe(document.body, { childList: true, subtree: true })

inject()
