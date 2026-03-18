<script lang="ts">
	import { onMount } from 'svelte';
	import { replace } from 'svelte-spa-router';
	import { locationsState, settingsState } from '~/lib/stores';
	import type { ThemePreference } from '~/lib/theme';
	import { geocodeCity } from '~/lib/weather';

	let city = $state('');
	let unit = $state<'C' | 'F'>('C');
	let theme = $state<ThemePreference>('system');
	let loading = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		const [locations, settings] = await Promise.all([
			locationsState.getValue(),
			settingsState.getValue()
		]);

		unit = settings.unit;
		theme = settings.theme ?? 'system';

		if (locations.list.length > 0) {
			replace('/weather');
		}
	});

	async function setupExtension(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		error = null;

		const query = city.trim();
		if (!query) {
			error = 'Enter a city name first.';
			return;
		}

		loading = true;

		try {
			const result = await geocodeCity(query);

			if (!result) {
				error = 'City not found. Try another name.';
				return;
			}

			await Promise.all([
				locationsState.setValue({
					list: [result],
					activeIndex: 0
				}),
				settingsState.setValue({ unit, theme })
			]);

			replace('/weather');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Setup failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<main class="mx-auto w-full space-y-4 bg-surface-container-high p-3.5 shadow-2xl">
	<p class="text-sm text-on-surface-variant">
		Add your first location to start using the extension.
	</p>

	<form class="space-y-2" onsubmit={setupExtension}>
		<input
			type="text"
			bind:value={city}
			placeholder="e.g. Kraków"
			class="w-full rounded-xl border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-outline focus:outline-none"
			disabled={loading}
		/>

		{#if error}
			<p class="rounded-xl bg-error-container px-3 py-2 text-sm text-on-error-container">
				{error}
			</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={loading}
		>
			{loading ? 'Setting up...' : 'Start with this city'}
		</button>
	</form>
</main>
