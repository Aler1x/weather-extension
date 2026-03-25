<script lang="ts">
	import { onMount } from 'svelte';
	import { replace } from 'svelte-spa-router';
	import { locationsState } from '~/lib/stores';
	import { geocodeCity } from '~/lib/weather';
	import type { GeoResult, LocationsState } from '~/lib/types';
	import { ArrowLeft, ArrowDown, ArrowUp, Trash2, MapPin, Check } from '@lucide/svelte';

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

	async function moveLocation(fromIndex: number, toIndex: number): Promise<void> {
		if (toIndex < 0 || toIndex >= locations.list.length || fromIndex === toIndex) {
			return;
		}

		const list = [...locations.list];
		const [movedLocation] = list.splice(fromIndex, 1);
		if (!movedLocation) {
			return;
		}

		list.splice(toIndex, 0, movedLocation);

		let activeIndex = locations.activeIndex;
		if (locations.activeIndex === fromIndex) {
			activeIndex = toIndex;
		} else if (fromIndex < toIndex) {
			if (locations.activeIndex > fromIndex && locations.activeIndex <= toIndex) {
				activeIndex = locations.activeIndex - 1;
			}
		} else if (locations.activeIndex >= toIndex && locations.activeIndex < fromIndex) {
			activeIndex = locations.activeIndex + 1;
		}

		const updated: LocationsState = { list, activeIndex };
		await locationsState.setValue(JSON.parse(JSON.stringify(updated)));
		locations = updated;
	}

	function locationLabel(loc: GeoResult): string {
		return [loc.name, loc.country].filter(Boolean).join(', ');
	}
</script>

<main class="mx-auto w-full bg-surface-bright p-3.5 shadow-2xl">
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

					<div class="ml-2 flex shrink-0 items-center gap-1">
						{#if index === locations.activeIndex}
							<Check size={14} strokeWidth={2.5} class="shrink-0 text-primary" />
						{/if}

						<button
							type="button"
							onclick={() => moveLocation(index, index - 1)}
							disabled={index === 0}
							aria-label="Move location up"
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
						>
							<ArrowUp size={13} strokeWidth={2} />
						</button>

						<button
							type="button"
							onclick={() => moveLocation(index, index + 1)}
							disabled={index === locations.list.length - 1}
							aria-label="Move location down"
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
						>
							<ArrowDown size={13} strokeWidth={2} />
						</button>

						<button
							type="button"
							onclick={() => removeLocation(index)}
							aria-label="Remove location"
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
						>
							<Trash2 size={13} strokeWidth={2} />
						</button>
					</div>
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
