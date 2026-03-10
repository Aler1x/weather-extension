<script lang="ts">
  import { Sun, CloudSun, Cloud, Wind, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from '@lucide/svelte';
  import { convertTemp, getWeatherIconName, getWeatherLabel, getIconColor } from './weather';
  import type { DayForecast } from './weather';

  interface Props {
    day: DayForecast;
    unit: 'C' | 'F';
    isToday: boolean;
  }

  let { day, unit, isToday }: Props = $props();

  const iconComponents: Record<string, any> = {
    Sun, CloudSun, Cloud, Wind, CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
  };

  const parsedDate = $derived((() => {
    const [y, m, d] = day.date.split('-').map(Number);
    return new Date(y, m - 1, d);
  })());

  const dayName = $derived(
    isToday
      ? 'Today'
      : parsedDate.toLocaleDateString('en-US', { weekday: 'long' })
  );

  const dateStr = $derived(
    parsedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  );

  const iconName = $derived(getWeatherIconName(day.weatherCode));
  const WeatherIcon = $derived(iconComponents[iconName] ?? Cloud);
  const iconColor = $derived(getIconColor(day.weatherCode));
  const label = $derived(getWeatherLabel(day.weatherCode));
  const tempHigh = $derived(convertTemp(day.tempMax, unit));
  const tempLow = $derived(convertTemp(day.tempMin, unit));
  const windSpeed = $derived(Math.round(day.windSpeed));
</script>

<div class="card" class:today={isToday}>
  <div class="left">
    <div class="icon">
      <WeatherIcon size={22} strokeWidth={1.5} color={iconColor} />
    </div>
    <div class="day-info">
      <span class="day-name">{dayName}</span>
      <span class="date">{dateStr} · {label}</span>
    </div>
  </div>
  <div class="right">
    <div class="temps">
      <span class="temp-high">{tempHigh}°</span>
      <span class="temp-sep">/</span>
      <span class="temp-low">{tempLow}°</span>
    </div>
    <div class="wind">
      <Wind size={11} strokeWidth={2} color="#6b7280" />
      <span>{windSpeed} km/h</span>
    </div>
  </div>
</div>

<style>
  .card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background-color 0.12s;
  }

  .card:last-child {
    border-bottom: none;
  }

  .card:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }

  .card.today {
    border-left: 2px solid #4c8bf5;
    padding-left: 12px;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .day-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .day-name {
    font-size: 13px;
    font-weight: 500;
    color: #f0f0f2;
    white-space: nowrap;
  }

  .date {
    font-size: 11px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    flex-shrink: 0;
  }

  .temps {
    display: flex;
    align-items: baseline;
    gap: 3px;
    font-size: 13px;
  }

  .temp-high {
    color: #f0f0f2;
    font-weight: 500;
  }

  .temp-sep {
    color: #3a3d47;
  }

  .temp-low {
    color: #6b7280;
  }

  .wind {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: #6b7280;
  }
</style>
