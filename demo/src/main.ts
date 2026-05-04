import { createHero } from './sections/hero'
import { createShowcases } from './sections/showcase'
import { createPlayground } from './sections/playground'

const app = document.getElementById('app')!

// Global HUD elements — scanlines + corner brackets
const hudOverlay = document.createElement('div')
hudOverlay.innerHTML = `
  <div class="scanlines"></div>
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>
`
document.body.appendChild(hudOverlay)

// Sections
const heroContainer = document.createElement('div')
const showcaseContainer = document.createElement('div')
const playgroundContainer = document.createElement('div')

app.appendChild(heroContainer)
app.appendChild(showcaseContainer)
app.appendChild(playgroundContainer)

// Footer
const footer = document.createElement('footer')
footer.className = 'site-footer'
footer.innerHTML = '// wave-maker &mdash; <a href="https://rising.company" target="_blank" rel="noopener noreferrer">rising company</a> &middot; webgl gradients &middot; open source'
app.appendChild(footer)

createHero(heroContainer)
createShowcases(showcaseContainer)
createPlayground(playgroundContainer)
