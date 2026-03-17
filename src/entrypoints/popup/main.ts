import { mount } from 'svelte';
import App from '~/entrypoints/popup/app.svelte';
import '~/assets/tailwind.css';

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
