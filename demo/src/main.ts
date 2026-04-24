import { createHero } from './sections/hero'
import { createShowcases } from './sections/showcase'
import { createPlayground } from './sections/playground'

const app = document.getElementById('app')!
const heroContainer = document.createElement('div')
const showcaseContainer = document.createElement('div')
const playgroundContainer = document.createElement('div')
app.appendChild(heroContainer)
app.appendChild(showcaseContainer)
app.appendChild(playgroundContainer)
createHero(heroContainer)
createShowcases(showcaseContainer)
createPlayground(playgroundContainer)
