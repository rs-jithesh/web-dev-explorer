import { mount } from 'svelte'
import './app.css'
import AppRoot from './AppRoot.svelte'

const app = mount(AppRoot, {
  target: document.getElementById('app')!,
})

export default app
