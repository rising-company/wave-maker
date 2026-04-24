import { createHero } from './sections/hero'
import { createShowcases } from './sections/showcase'

const app = document.getElementById('app')!
const heroContainer = document.createElement('div')
const showcaseContainer = document.createElement('div')
app.appendChild(heroContainer)
app.appendChild(showcaseContainer)
createHero(heroContainer)
createShowcases(showcaseContainer)
