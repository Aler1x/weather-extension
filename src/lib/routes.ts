import Landing from '~/lib/pages/landing.svelte';
import Weather from '~/lib/pages/weather.svelte';
import Locations from '~/lib/pages/locations.svelte';

export default {
  '/': Landing,
  '/weather': Weather,
  '/locations': Locations,
};
