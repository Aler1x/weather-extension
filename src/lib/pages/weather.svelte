<script lang="ts">
	import { onMount } from 'svelte';
	import { replace } from 'svelte-spa-router';
	import type { ForecastData } from '~/lib/types';
	import { forecastCache, locationsState, settingsState } from '~/lib/stores';
	import {
		cacheKey,
		convertTemp,
		fetchForecast,
		formatHour,
		getWeatherIconUrl,
		getWeatherLabel
	} from '~/lib/weather';
	import M3LoadingIndicator from '@alerix/m3-loading-indicator/svelte';
	import { Layers, MapPin, Heart } from '@lucide/svelte';

	const CACHE_TTL_MS = 20 * 60 * 1000;

	type HourlyView = {
		label: string;
		temp: number;
		iconUrl: string;
	};

	type DailyView = {
		day: string;
		high: number;
		low: number;
		iconUrl: string;
	};

	let loading = $state(true);
	let error = $state<string | null>(null);

	let unit = $state<'C' | 'F'>('C');
	let locationLabel = $state('');
	let conditionLabel = $state('');
	let locationsCount = $state(0);

	let currentTemp = $state(0);
	let feelsLikeTemp = $state(0);
	let todayHigh = $state(0);
	let todayLow = $state(0);
	let currentIconUrl = $state('');

	let hourlyItems = $state<HourlyView[]>([]);
	let dailyItems = $state<DailyView[]>([]);

	let rawForecast = $state<ForecastData | null>(null);

	function toDayName(date: string): string {
		return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
	}

	function isDayFromTime(time: string): boolean {
		const hour = Number.parseInt(time.slice(11, 13), 10);
		return hour >= 6 && hour < 19;
	}

	function formatHourLabel(time: string, index: number): string {
		if (index === 0) return 'Now';
		return formatHour(time).replace('AM', ' AM').replace('PM', ' PM');
	}

	function applyForecast(forecast: ForecastData, isDark: boolean): void {
		const currentHour = new Date().getHours();
		const isDayNow = currentHour >= 6 && currentHour < 19;

		currentTemp = convertTemp(forecast.current.temp, unit);
		feelsLikeTemp = convertTemp(forecast.current.apparentTemp, unit);
		currentIconUrl = getWeatherIconUrl(forecast.current.weatherCode, isDayNow, isDark);
		conditionLabel = getWeatherLabel(forecast.current.weatherCode).replace(' sky', '');

		const today = forecast.daily[0];
		if (today) {
			todayHigh = convertTemp(today.tempMax, unit);
			todayLow = convertTemp(today.tempMin, unit);
		}

		hourlyItems = forecast.hourly.map((point, index) => ({
			label: formatHourLabel(point.time, index),
			temp: convertTemp(point.temp, unit),
			iconUrl: getWeatherIconUrl(point.weatherCode, isDayFromTime(point.time), isDark)
		}));

		dailyItems = forecast.daily.slice(0, 4).map((day) => ({
			day: toDayName(day.date),
			high: convertTemp(day.tempMax, unit),
			low: convertTemp(day.tempMin, unit),
			iconUrl: getWeatherIconUrl(day.weatherCode, true, isDark)
		}));
	}

	async function toggleUnit(): Promise<void> {
		unit = unit === 'C' ? 'F' : 'C';
		await settingsState.setValue({ unit });
		if (rawForecast) {
			const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			applyForecast(rawForecast, isDark);
		}
	}

	onMount(async () => {
		try {
			const [savedLocations, savedSettings] = await Promise.all([
				locationsState.getValue(),
				settingsState.getValue()
			]);

			unit = savedSettings.unit;
			locationsCount = savedLocations.list.length;

			const activeLocation = savedLocations.list[savedLocations.activeIndex];
			if (!activeLocation) {
				replace('/');
				return;
			}

			locationLabel = [activeLocation.name, activeLocation.admin1, activeLocation.country]
				.filter(Boolean)
				.join(', ');

			const key = cacheKey(activeLocation.latitude, activeLocation.longitude);
			const cache = await forecastCache.getValue();
			const cachedItem = cache[key];

			const shouldRefresh = !cachedItem || Date.now() - cachedItem.fetchedAt > CACHE_TTL_MS;
			const forecast = shouldRefresh
				? await fetchForecast(activeLocation.latitude, activeLocation.longitude)
				: cachedItem;

			if (shouldRefresh) {
				await forecastCache.setValue({
					...cache,
					[key]: {
						...forecast,
						fetchedAt: Date.now()
					}
				});
			}

		rawForecast = forecast;
		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyForecast(forecast, isDark);
		} catch {
			error = 'Unable to load weather right now.';
		} finally {
			loading = false;
		}
	});
</script>

<main class="mx-auto w-full bg-surface-container-high p-3.5 shadow-2xl">
	{#if loading}
		<div class="flex items-center justify-center">
			<M3LoadingIndicator />
		</div>
	{:else if error}
		<div
			class="rounded-2xl bg-error-container px-4 py-8 text-center text-sm text-on-error-container"
		>
			{error}
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<button
				onclick={() => replace('/locations')}
				class="flex min-w-0 flex-1 h-6 items-center gap-1 rounded-md border-none bg-transparent px-1 py-0.75 text-xs text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
			>
				<MapPin size={11} strokeWidth={2} class="shrink-0" />
				<span class="truncate">{locationLabel}</span>
			</button>

			<div class="flex items-center gap-1 px-1">
				<button
					onclick={toggleUnit}
					class="flex h-6 w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-md bg-surface-container-highest text-xs font-semibold text-on-surface transition-colors hover:bg-surface-variant hover:text-on-surface-variant"
				>
					°{unit}
				</button>
				<a
					href="https://send.monobank.ua/jar/8zzT8r4Hf7"
					target="_blank noopener noreferrer"
					class="flex h-6 w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-md bg-surface-container-highest text-on-surface no-underline transition-colors hover:bg-surface-variant hover:text-on-surface-variant"
				>
					<Heart size={12} strokeWidth={2} />
				</a>
			</div>
		</div>

		<header class="px-2 py-4">
			<div class="flex items-start justify-between">
				<div>
					<div class="flex items-center gap-2">
						<img src={currentIconUrl} alt={conditionLabel} class="h-8 w-8" />
						<p class="leading-none text-on-surface">{conditionLabel}</p>
					</div>
					<p class="mt-1 text-on-surface">Feels like {feelsLikeTemp}°</p>
					<p class="mt-0.5 text-on-surface-variant">{todayHigh}° · {todayLow}°</p>
				</div>

				<h1 class="text-7xl tracking-tight text-on-surface">
					{currentTemp}°
				</h1>
			</div>
		</header>

		<section class="mb-4 rounded-2xl bg-surface-container px-3 py-2.5">
			<div class="grid grid-cols-5 gap-2">
				{#each hourlyItems as hour}
					<div class="text-center">
						<p class="leading-none text-on-surface">{hour.temp}°</p>
						<img src={hour.iconUrl} alt={hour.label} class="mx-auto mt-1.5 h-8 w-8" />
						<p class="mt-1 text-on-surface-variant">{hour.label}</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="space-y-0.5 overflow-hidden rounded-2xl">
			{#each dailyItems as day}
				<div class="flex items-center justify-between px-4 py-2.5 bg-surface-container">
					<p class="text-on-surface">{day.day}</p>
					<div class="flex items-center gap-2">
						<p class="text-on-surface">{day.high}°</p>
						<p class="text-on-surface-variant">{day.low}°</p>
						<img src={day.iconUrl} alt={day.day} class="h-7 w-7" />
					</div>
				</div>
			{/each}
		</section>
	{/if}
</main>
