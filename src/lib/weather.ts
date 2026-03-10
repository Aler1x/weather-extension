export interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export interface DayForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  windSpeed: number;
}

export async function geocodeCity(city: string): Promise<GeoResult | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  if (!res.ok) throw new Error('Geocoding request failed');
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

export async function fetchForecast(lat: number, lon: number): Promise<DayForecast[]> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=auto&forecast_days=10`
  );
  if (!res.ok) throw new Error('Weather request failed');
  const data = await res.json();
  return (data.daily.time as string[]).map((date, i) => ({
    date,
    weatherCode: data.daily.weathercode[i] as number,
    tempMax: data.daily.temperature_2m_max[i] as number,
    tempMin: data.daily.temperature_2m_min[i] as number,
    windSpeed: data.daily.windspeed_10m_max[i] as number,
  }));
}

export function convertTemp(celsius: number, unit: 'C' | 'F'): number {
  return unit === 'C' ? Math.round(celsius) : Math.round(celsius * 9 / 5 + 32);
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

// Returns a lucide icon name from @lucide/svelte
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

export function getIconColor(code: number): string {
  if (code === 0 || code === 1) return '#f5a623';
  if (code === 2) return '#94a3b8';
  if (code === 3 || code === 45 || code === 48) return '#6b7280';
  if (code >= 51 && code <= 55) return '#93c5fd';
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return '#60a5fa';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '#bfdbfe';
  if (code >= 95) return '#f59e0b';
  return '#9ca3af';
}
