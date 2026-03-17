<script lang="ts">
	import { onMount } from 'svelte';
	import { replace } from 'svelte-spa-router';
	import { locationsState } from '~/lib/stores';
	import { geocodeCity } from '~/lib/weather';
	import type { GeoResult, LocationsState } from '~/lib/types';
	import { ArrowLeft, Trash2, MapPin, Check } from '@lucide/svelte';

	let city = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let locations = $state<LocationsState>({ list: [], activeIndex: 0 });

	onMount(async () => {
		locations = await locationsState.getValue();
	});

	async function addLocation(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		error = null;

		const query = city.trim();
		if (!query) return;

		loading = true;

		try {
			const result = await geocodeCity(query);

			if (!result) {
				error = 'City not found. Try another name.';
				return;
			}

			const alreadyExists = locations.list.some(
				(l) => l.latitude === result.latitude && l.longitude === result.longitude
			);
			if (alreadyExists) {
				error = 'This location is already saved.';
				return;
			}

			const updated: LocationsState = {
				list: [...locations.list, result],
				activeIndex: locations.activeIndex
			};

			await locationsState.setValue(JSON.parse(JSON.stringify(updated)));
			locations = updated;
			city = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not add location. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function setActive(index: number): Promise<void> {
		const updated: LocationsState = { ...locations, activeIndex: index };
		await locationsState.setValue(JSON.parse(JSON.stringify(updated)));
		locations = updated;
		replace('/weather');
	}

	async function removeLocation(index: number): Promise<void> {
		const newList = locations.list.filter((_, i) => i !== index);
		const newActive =
			locations.activeIndex >= newList.length
				? Math.max(0, newList.length - 1)
				: locations.activeIndex === index
					? 0
					: locations.activeIndex > index
						? locations.activeIndex - 1
						: locations.activeIndex;

		const updated: LocationsState = { list: newList, activeIndex: newActive };
		await locationsState.setValue(JSON.parse(JSON.stringify(updated)));
		locations = updated;

		if (newList.length === 0) replace('/');
	}

	function locationLabel(loc: GeoResult): string {
		return [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');
	}
</script>

<main class="mx-auto w-full bg-surface-container-high p-3.5 shadow-2xl">
	<div class="mb-3 flex items-center gap-2">
		<button
			onclick={() => replace('/weather')}
			class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
		>
			<ArrowLeft size={16} strokeWidth={2} />
		</button>
		<h1 class="text-sm font-semibold text-on-surface">Locations</h1>
	</div>

	{#if locations.list.length > 0}
		<section class="mb-3 space-y-0.5 overflow-hidden rounded-2xl">
			{#each locations.list as loc, index}
				<div class="flex items-center justify-between px-4 py-2.5 bg-surface-container">
					<button
						onclick={() => setActive(index)}
						class="flex min-w-0 flex-1 items-center gap-2 text-left"
					>
						<MapPin
							size={14}
							strokeWidth={2}
							class={index === locations.activeIndex ? 'shrink-0 text-primary' : 'shrink-0 text-on-surface-variant'}
						/>
						<span
							class="truncate text-sm {index === locations.activeIndex
								? 'font-medium text-on-surface'
								: 'text-on-surface-variant'}"
						>
							{locationLabel(loc)}
						</span>
					</button>

					{#if index === locations.activeIndex}
						<Check size={14} strokeWidth={2.5} class="shrink-0 text-primary" />
					{/if}

					<button
						onclick={() => removeLocation(index)}
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
					>
						<Trash2 size={13} strokeWidth={2} />
					</button>
				</div>
			{/each}
		</section>
	{/if}

	<form class="space-y-2" onsubmit={addLocation}>
		<input
			type="text"
			bind:value={city}
			placeholder="Add a city…"
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
			{loading ? 'Searching…' : 'Add location'}
		</button>
	</form>
</main>
