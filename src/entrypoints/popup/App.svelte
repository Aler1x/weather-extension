<script lang="ts">
	import { onMount } from 'svelte';
	import Router, { replace } from 'svelte-spa-router';
	import routes from '~/lib/routes';
	import { locationsState } from '~/lib/stores';

	let ready = $state(false);

	onMount(async () => {
		const locs = await locationsState.getValue();
		const hasLocations = Array.isArray(locs?.list) && locs.list.length > 0;
		replace(hasLocations ? '/weather' : '/');
		ready = true;
	});
</script>

{#if ready}
	<Router {routes} />
{/if}
