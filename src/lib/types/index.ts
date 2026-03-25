export interface GeoResult {
	name: string;
	latitude: number;
	longitude: number;
	country: string;
}

export interface DayForecast {
	date: string;
	weatherCode: number;
	tempMax: number;
	tempMin: number;
	windSpeed: number;
}

export interface HourlyPoint {
	time: string;
	temp: number;
	weatherCode: number;
}

export interface CurrentWeather {
	temp: number;
	apparentTemp: number;
	weatherCode: number;
	windSpeed: number;
}

export interface ForecastData {
	daily: DayForecast[];
	hourly: HourlyPoint[];
	current: CurrentWeather;
}

export interface ForecastCache extends ForecastData {
	fetchedAt: number;
}

export interface LocationsState {
	list: GeoResult[];
	activeIndex: number;
}

export interface Settings {
	unit: 'C' | 'F';
	theme: 'system' | 'light' | 'dark';
}
