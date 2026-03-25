import { mount } from 'svelte';
import App from '@/entrypoints/popup/App.svelte';
import '~/assets/tailwind.css';
import { settingsState } from '~/lib/stores';
import { applyTheme } from '~/lib/theme';

const settings = await settingsState.getValue();
applyTheme(settings.theme ?? 'system');

const app = mount(App, {
	target: document.getElementById('app')!
});

export default app;
