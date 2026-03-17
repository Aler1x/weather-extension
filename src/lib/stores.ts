import { storage } from '@wxt-dev/storage';
import type { LocationsState, Settings, ForecastCache } from '~/lib/types';

export const locationsState = storage.defineItem<LocationsState>('local:locations', {
  fallback: { list: [], activeIndex: 0 },
});

export const settingsState = storage.defineItem<Settings>('local:settings', {
  fallback: { unit: 'C' },
});

/** keyed by `${latitude},${longitude}` */
export const forecastCache = storage.defineItem<Record<string, ForecastCache>>('local:cache', {
  fallback: {},
});
