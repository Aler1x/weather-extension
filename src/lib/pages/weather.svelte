<script lang="ts">
	import { onMount } from 'svelte';
	import { replace } from 'svelte-spa-router';
	import { Moon, Sun, MapPin, Heart } from '@lucide/svelte';
	import type { ForecastData } from '~/lib/types';
	import { forecastCache, locationsState, settingsState } from '~/lib/stores';
	import { applyTheme, resolveIsDark, type ThemePreference } from '~/lib/theme';
	import {
		cacheKey,
		convertTemp,
		fetchForecast,
		formatHour,
		getWeatherIconUrl,
		getWeatherLabel
	} from '~/lib/weather';
	import M3LoadingIndicator from '@alerix/m3-loading-indicator/svelte';

	const CACHE_TTL_MS = 20 * 60 * 1000;

	function wheelToHorizontalScroll(node: HTMLDivElement) {
		function onWheel(e: WheelEvent) {
			const maxLeft = Math.max(0, node.scrollWidth - node.clientWidth);
			if (maxLeft <= 0) return;

			let delta: number;
			if (e.shiftKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
				delta = e.deltaY;
			} else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
				delta = e.deltaX;
			} else {
				delta = e.deltaY;
			}

			if (delta === 0) return;

			const prev = node.scrollLeft;
			const next = Math.min(maxLeft, Math.max(0, prev + delta));
			if (next !== prev) {
				node.scrollLeft = next;
				e.preventDefault();
			}
		}

		node.addEventListener('wheel', onWheel, { passive: false });
		return {
			destroy() {
				node.removeEventListener('wheel', onWheel);
			}
		};
	}

	type HourlyView = {
		label: string;
		temp: number;
		iconUrl: string;
		showDaySeparator: boolean;
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
	let theme = $state<ThemePreference>('system');
	let isDarkTheme = $state(false);
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

		hourlyItems = forecast.hourly.map((point, index) => {
			const dayKey = point.time.slice(0, 10);
			const prevDayKey = index > 0 ? forecast.hourly[index - 1].time.slice(0, 10) : dayKey;
			return {
				label: formatHourLabel(point.time, index),
				temp: convertTemp(point.temp, unit),
				iconUrl: getWeatherIconUrl(point.weatherCode, isDayFromTime(point.time), isDark),
				showDaySeparator: index > 0 && dayKey !== prevDayKey
			};
		});

		dailyItems = forecast.daily.slice(0, 4).map((day) => ({
			day: toDayName(day.date),
			high: convertTemp(day.tempMax, unit),
			low: convertTemp(day.tempMin, unit),
			iconUrl: getWeatherIconUrl(day.weatherCode, true, isDark)
		}));
	}

	async function toggleUnit(): Promise<void> {
		unit = unit === 'C' ? 'F' : 'C';
		await settingsState.setValue({ unit, theme });
		if (rawForecast) {
			applyForecast(rawForecast, isDarkTheme);
		}
	}

	async function toggleTheme(): Promise<void> {
		theme = resolveIsDark(theme) ? 'light' : 'dark';
		isDarkTheme = applyTheme(theme);
		await settingsState.setValue({ unit, theme });
		if (rawForecast) {
			applyForecast(rawForecast, isDarkTheme);
		}
	}

	onMount(async () => {
		try {
			const [rawLocations, savedSettings] = await Promise.all([
				locationsState.getValue(),
				settingsState.getValue()
			]);

			const savedLocations = rawLocations?.list ? rawLocations : { list: [], activeIndex: 0 };

			unit = savedSettings.unit;
			theme = savedSettings.theme ?? 'system';
			isDarkTheme = applyTheme(theme);
			locationsCount = savedLocations.list.length;

			const activeLocation = savedLocations.list[savedLocations.activeIndex];
			if (!activeLocation) {
				replace('/');
				return;
			}

			locationLabel = [activeLocation.name, activeLocation.country].filter(Boolean).join(', ');

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
			applyForecast(forecast, isDarkTheme);
		} catch {
			error = 'Unable to load weather right now.';
		} finally {
			loading = false;
		}
	});
</script>

<main class="mx-auto w-full bg-surface-bright p-3.5 shadow-2xl">
	{#if loading}
		<div class="flex h-[506px] items-center justify-center">
			<M3LoadingIndicator />
		</div>
	{:else if error}
		<div
			class="rounded-2xl bg-error-container px-4 py-8 text-center text-sm text-on-error-container"
		>
			{error}
		</div>
	{:else}
		<header class="flex items-center justify-between">
			<button
				onclick={() => replace('/locations')}
				class="flex h-6 min-w-0 flex-1 items-center gap-1 rounded-md border-none bg-transparent px-1 py-0.75 text-xs text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
			>
				<MapPin size={11} strokeWidth={2} class="shrink-0" />
				<span class="truncate">{locationLabel}</span>
			</button>

			<div class="flex items-center gap-1 px-1">
				<button
					type="button"
					onclick={toggleTheme}
					aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
					class="flex h-6 w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-md bg-surface-container-highest text-on-surface transition-colors hover:bg-surface-variant hover:text-on-surface-variant"
				>
					{#if isDarkTheme}
						<Moon size={12} strokeWidth={2} />
					{:else}
						<Sun size={12} strokeWidth={2} />
					{/if}
				</button>
				<button
					type="button"
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
		</header>

		<section class="px-2 py-4">
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
		</section>

		<section class="mb-4 rounded-2xl bg-surface-container py-2.5 pr-0 pl-3">
			<div
				class="scrollbar-hide flex items-stretch gap-2 overflow-x-auto pb-1.5 pr-3 [-webkit-overflow-scrolling:touch]"
				role="region"
				aria-label="Hourly forecast"
				use:wheelToHorizontalScroll
			>
				{#each hourlyItems as hour}
					{#if hour.showDaySeparator}
						<div class="w-0.75 rounded-full shrink-0 self-stretch bg-outline" aria-hidden="true"></div>
					{/if}
					<div class="w-12 shrink-0 text-center">
						<p class="leading-none text-on-surface">{hour.temp}°</p>
						<img src={hour.iconUrl} alt={hour.label} class="mx-auto mt-1.5 h-8 w-8" />
						<p class="mt-1 text-on-surface-variant">{hour.label}</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="space-y-0.5 overflow-hidden rounded-2xl">
			{#each dailyItems as day}
				<div class="flex items-center justify-between bg-surface-container px-4 py-2.5">
					<p class="text-on-surface">{day.day}</p>
					<div class="flex items-center gap-2">
						<p class="text-on-surface">{day.high}°</p>
						<p class="text-on-surface-variant">{day.low}°</p>
						<img src={day.iconUrl} alt={day.day} class="h-7 w-7" />
					</div>
				</div>
			{/each}
		</section>

		<section class="flex items-center justify-center pt-1">
			<a
				href="https://open-meteo.com/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-on-surface-variant"
			>
				Powered by Open-Meteo
			</a>
		</section>
	{/if}
</main>
