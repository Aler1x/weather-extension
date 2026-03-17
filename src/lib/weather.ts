import type { GeoResult, DayForecast, HourlyPoint, CurrentWeather, ForecastData } from '~/lib/types';

export function cacheKey(lat: number, lon: number): string {
  return `${lat},${lon}`;
}

export async function geocodeCity(city: string): Promise<GeoResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error('Network error. Check your connection.');
  }

  if (res.status === 429) throw new Error('Too many requests. Try again in a minute.');
  if (!res.ok) throw new Error(`Geocoding failed (${res.status}).`);

  const data = await res.json();
  if (!data.results?.length) return null;
  const r = data.results[0];
  return {
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
  };
}

export async function fetchForecast(lat: number, lon: number): Promise<ForecastData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weathercode,windspeed_10m');
  url.searchParams.set('hourly', 'temperature_2m,weathercode');
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Weather request failed');
  const data = await res.json();

  const daily: DayForecast[] = (data.daily.time as string[]).map((date, i) => ({
    date,
    weatherCode: data.daily.weathercode[i] as number,
    tempMax: data.daily.temperature_2m_max[i] as number,
    tempMin: data.daily.temperature_2m_min[i] as number,
    windSpeed: data.daily.windspeed_10m_max[i] as number,
  }));

  // Next 5 hours starting from current local hour (index 0 = today midnight)
  const nowHour = new Date().getHours();
  const hourly: HourlyPoint[] = (data.hourly.time as string[])
    .map((time, i) => ({
      time,
      temp: Math.round(data.hourly.temperature_2m[i] as number),
      weatherCode: data.hourly.weathercode[i] as number,
    }))
    .slice(nowHour, nowHour + 5);

  const current: CurrentWeather = {
    temp: Math.round(data.current.temperature_2m as number),
    apparentTemp: Math.round(data.current.apparent_temperature as number),
    weatherCode: data.current.weathercode as number,
    windSpeed: Math.round(data.current.windspeed_10m as number),
  };

  return { daily, hourly, current };
}

export function convertTemp(celsius: number, unit: 'C' | 'F'): number {
  return unit === 'C' ? Math.round(celsius) : Math.round(celsius * 9 / 5 + 32);
}

export function formatHour(timeStr: string): string {
  const h = parseInt(timeStr.slice(11, 13), 10);
  if (h === 0) return '12AM';
  if (h < 12) return `${h}AM`;
  if (h === 12) return '12PM';
  return `${h - 12}PM`;
}

export function getWeatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code === 96 || code === 99) return 'Thunderstorm';
  return 'Unknown';
}

export function getWeatherIconName(code: number): string {
  if (code === 0 || code === 1) return 'Sun';
  if (code === 2) return 'CloudSun';
  if (code === 3) return 'Cloud';
  if (code === 45 || code === 48) return 'Wind';
  if (code >= 51 && code <= 55) return 'CloudDrizzle';
  if (code >= 61 && code <= 65) return 'CloudRain';
  if (code >= 71 && code <= 77) return 'CloudSnow';
  if (code >= 80 && code <= 82) return 'CloudRain';
  if (code >= 85 && code <= 86) return 'CloudSnow';
  if (code >= 95) return 'CloudLightning';
  return 'Cloud';
}

function wmoToIconFile(code: number, isDay: boolean): string {
  if (code === 0 || code === 1) return isDay ? 'clear_day.svg' : 'clear_night.svg';
  if (code === 2) return isDay ? 'partly_cloudy_day.svg' : 'partly_cloudy_night.svg';
  if (code === 3) return isDay ? 'mostly_cloudy_day.svg' : 'mostly_cloudy_night.svg';
  if (code === 45 || code === 48) return 'haze_fog.svg';
  if (code >= 51 && code <= 55) return 'drizzle.svg';
  if (code >= 61 && code <= 65) return 'heavy_rain.svg';
  if (code >= 66 && code <= 67) return 'rain_with_snow.svg';
  if (code >= 71 && code <= 75) return 'heavy_snow.svg';
  if (code === 77) return 'blizzard.svg';
  if (code >= 80 && code <= 82) return 'rain_showers.svg';
  if (code >= 85 && code <= 86) return 'snow_showers.svg';
  if (code === 95) return 'thunderstorms.svg';
  if (code === 96 || code === 99) return 'strong_thunderstorms.svg';
  return 'cloudy.svg';
}

export function getWeatherIconUrl(code: number, isDay: boolean, isDark: boolean): string {
  const theme = isDark ? 'dark' : 'light';
  return `/v2/${theme}/${wmoToIconFile(code, isDay)}`;
}

export function getIconColor(code: number): string {
  if (code === 0 || code === 1) return '#F9A825';  // amber — sun (widget-like)
  if (code === 2) return '#7B6BA8';                // mid purple — partly cloudy
  if (code === 3 || code === 45 || code === 48) return '#6B7280'; // gray — overcast/fog
  if (code >= 51 && code <= 55) return '#5B8FCF';  // blue — drizzle
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return '#4A7FBF'; // deeper blue — rain
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '#8BA3C4'; // light blue — snow
  if (code >= 95) return '#E07B5A';                // coral — thunderstorm
  return '#6B7280';
}
