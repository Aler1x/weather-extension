<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { MapPin, Layers, Plus, Trash, Heart } from "@lucide/svelte";
  import WeatherCard from "~/lib/WeatherCard.svelte";
  import { geocodeCity, fetchForecast } from "~/lib/weather";
  import { locationsItem, activeIndexItem, unitItem } from "~/lib/stores";
  import type { GeoResult, DayForecast } from "~/lib/weather";

  let locations = $state<GeoResult[]>([]);
  let activeIndex = $state(0);
  let unit = $state<"C" | "F">("C");
  let forecast = $state<DayForecast[]>([]);

  let showSearch = $state(false); // full-page search (no locations yet)
  let showLocations = $state(false); // locations panel
  let showAddSearch = $state(false); // inline add-location form inside panel

  let cityInput = $state("");
  let loading = $state(false);
  let error = $state("");

  const location = $derived(locations[activeIndex] ?? null);

  onMount(async () => {
    locations = (await locationsItem.getValue()) ?? [];
    activeIndex = (await activeIndexItem.getValue()) ?? 0;
    unit = (await unitItem.getValue()) ?? "C";

    if (locations.length > 0) {
      await loadForecast();
    } else {
      showSearch = true;
    }
  });

  async function loadForecast() {
    const loc = locations[activeIndex];
    if (!loc) return;
    loading = true;
    error = "";
    try {
      forecast = await fetchForecast(loc.latitude, loc.longitude);
    } catch {
      error = "Failed to load weather data.";
    } finally {
      loading = false;
    }
  }

  async function addLocation(e: SubmitEvent) {
    e.preventDefault();
    const query = cityInput.trim();
    if (!query) return;
    loading = true;
    error = "";

    let result: GeoResult | null = null;
    try {
      result = await geocodeCity(query);
    } catch {
      error = "Search failed. Check your connection.";
      loading = false;
      return;
    }

    if (!result) {
      error = `"${query}" not found.`;
      loading = false;
      return;
    }

    const duplicate = locations.some(
      (l) => l.name === result!.name && l.country === result!.country,
    );
    if (duplicate) {
      error = "Location already saved.";
      loading = false;
      return;
    }

    const newLocations = [...locations, result];
    const newIndex = newLocations.length - 1;
    locations = newLocations;
    activeIndex = newIndex;
    cityInput = "";
    showSearch = false;
    showAddSearch = false;
    showLocations = false;
    await locationsItem.setValue($state.snapshot(newLocations));
    await activeIndexItem.setValue(newIndex);
    await loadForecast();
  }

  async function switchLocation(i: number) {
    if (i === activeIndex) {
      showLocations = false;
      return;
    }
    activeIndex = i;
    await activeIndexItem.setValue(i);
    showLocations = false;
    await loadForecast();
  }

  async function removeLocation(i: number) {
    const wasActive = i === activeIndex; // capture before any mutation
    const newLocations = locations.filter((_, idx) => idx !== i);
    locations = newLocations;
    await locationsItem.setValue($state.snapshot(newLocations));

    if (newLocations.length === 0) {
      activeIndex = 0;
      await activeIndexItem.setValue(0);
      showLocations = false;
      showAddSearch = false;
      showSearch = true;
      forecast = [];
      return;
    }

    let newActive = activeIndex;
    if (i < activeIndex) newActive = activeIndex - 1;
    else if (wasActive) newActive = Math.min(activeIndex, newLocations.length - 1);

    activeIndex = newActive;
    await activeIndexItem.setValue(newActive);
    if (wasActive) await loadForecast();
  }

  async function toggleUnit() {
    unit = unit === "C" ? "F" : "C";
    await unitItem.setValue(unit);
  }

  function openLocations() {
    showLocations = !showLocations;
    if (!showLocations) {
      showAddSearch = false;

      cityInput = "";
    }
  }
</script>

{#if showSearch}
  <div class="search-screen">
    <div class="brand">
      <div class="brand-icon">🌤</div>
      <h1>Weather</h1>
      <p>Enter your city to get started</p>
    </div>
    <form class="search-form" onsubmit={addLocation}>
      <input
        class="search-input"
        bind:value={cityInput}
        placeholder="Search city..."
        disabled={loading}
      />
      <button class="search-btn" type="submit" disabled={loading || !cityInput.trim()}>
        {loading ? "…" : "Go"}
      </button>
    </form>
    {#if error}
      <p class="error-text">{error}</p>
    {/if}
  </div>
{:else}
  <div class="popup">
    <div class="header">
      <button
        class="icon-btn"
        onclick={openLocations}
        title="Locations"
        class:active={showLocations}
      >
        <Layers size={13} strokeWidth={2} />
        <span class="loc-count">{locations.length}</span>
      </button>

      <button class="location-btn" onclick={openLocations}>
        <MapPin size={12} strokeWidth={2} />
        <span class="location-name">
          {location?.name}{location?.admin1 ? `, ${location.admin1}` : ""}, {location?.country}
        </span>
      </button>

      <button class="unit-btn" onclick={toggleUnit}>°{unit}</button>
      <a href="https://send.monobank.ua/jar/8zzT8r4Hf7" target="_blank" class="heart-btn">
        <Heart size={12} strokeWidth={2} />
      </a>
    </div>

    <div class="content">
      {#if showLocations}
        <div class="locations-panel" transition:fly={{ y: -6, duration: 120 }}>
          {#if showAddSearch}
            <form class="add-form" onsubmit={addLocation}>
              <input
                class="search-input"
                bind:value={cityInput}
                placeholder="Search city..."
                disabled={loading}
              />
              <button class="search-btn" type="submit" disabled={loading || !cityInput.trim()}>
                {loading ? "…" : "Go"}
              </button>
              <button
                class="cancel-btn"
                type="button"
                onclick={() => {
                  showAddSearch = false;
                  cityInput = "";
                }}
              >
                <Trash size={13} strokeWidth={2} />
              </button>
            </form>
            {#if error}
              <p class="add-error">{error}</p>
            {/if}
          {:else}
            {#each locations as loc, i}
              <div
                class="loc-item"
                class:active={i === activeIndex}
                role="button"
                tabindex="0"
                onclick={() => switchLocation(i)}
                onkeydown={(e) => e.key === "Enter" && switchLocation(i)}
              >
                <div class="loc-dot" class:active={i === activeIndex}></div>
                <div class="loc-info">
                  <span class="loc-name">{loc.name}{loc.admin1 ? `, ${loc.admin1}` : ""}</span>
                  <span class="loc-country">{loc.country}</span>
                </div>
                <button
                  class="loc-remove"
                  onclick={(e) => {
                    e.stopPropagation();
                    removeLocation(i);
                  }}
                  title="Remove"
                >
                  <Trash size={12} strokeWidth={2} />
                </button>
              </div>
            {/each}

            <button
              class="add-location-btn"
              onclick={() => {
                showAddSearch = true;
                cityInput = "";
              }}
            >
              <Plus size={13} strokeWidth={2} />
              Add location
            </button>
          {/if}
        </div>
      {/if}

      {#if loading}
        <div class="state-msg">Loading forecast…</div>
      {:else if error}
        <div class="state-msg error-text">{error}</div>
        <button class="retry-btn" onclick={loadForecast}>Retry</button>
      {:else}
        <div class="forecast">
          {#each forecast as day, i}
            <WeatherCard {day} {unit} isToday={i === 0} />
          {/each}
          <a href="https://open-meteo.com/" target="_blank" class="open-meteo-link">
            weather data provided by open-meteo
          </a>
        </div>
      {/if}
    </div>
  </div>
{/if}
