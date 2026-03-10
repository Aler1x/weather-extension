import { storage } from '@wxt-dev/storage';
import type { GeoResult } from '~/lib/weather';

export const locationsItem = storage.defineItem<GeoResult[]>('local:locations', {
  fallback: [],
  debug: true,
});

export const activeIndexItem = storage.defineItem<number>('local:activeIndex', {
  fallback: 0,
  debug: true,
});

export const unitItem = storage.defineItem<'C' | 'F'>('local:unit', {
  fallback: 'C',
  debug: true,
});
