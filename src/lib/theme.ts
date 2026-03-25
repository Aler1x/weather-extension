export type ThemePreference = 'system' | 'light' | 'dark';

function prefersDarkMode(): boolean {
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveIsDark(theme: ThemePreference): boolean {
	switch (theme) {
		case 'dark':
			return true;
		case 'light':
			return false;
		case 'system':
			return prefersDarkMode();
	}
}

export function applyTheme(theme: ThemePreference): boolean {
	const isDark = resolveIsDark(theme);
	document.documentElement.classList.toggle('dark', isDark);
	return isDark;
}
