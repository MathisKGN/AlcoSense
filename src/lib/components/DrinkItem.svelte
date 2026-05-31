<script lang="ts">
	import { DRINK_PRESETS, type Drink } from '$lib/types';
	import { updateDrink, removeDrink } from '$lib/stores.svelte';

	let { drink }: { drink: Drink } = $props();

	const icon = $derived(DRINK_PRESETS[drink.type].icon);
	const label = $derived(DRINK_PRESETS[drink.type].label);
	const volumeCl = $derived(drink.volume / 10);

	function setVolumeCl(cl: number) {
		const ml = Math.max(0, Math.round(cl * 10));
		updateDrink(drink.id, { volume: ml });
	}

	function setDegre(v: number) {
		const degre = Math.max(0, Math.min(100, Math.round(v * 2) / 2));
		updateDrink(drink.id, { degre });
	}
</script>

<div
	class="flex items-center gap-3 rounded-2xl border border-surface-container bg-white p-3 shadow-sm"
>
	<div
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary"
	>
		<span class="material-symbols-outlined">{icon}</span>
	</div>
	<div class="min-w-0 flex-1 space-y-2">
		<span class="block text-sm font-bold">{label}</span>
		<div class="grid grid-cols-2 gap-2">
			<label class="block">
				<span class="mb-1 block text-[10px] font-bold text-outline uppercase">Volume (cl)</span>
				<input
					type="number"
					inputmode="decimal"
					min="0"
					step="0.5"
					value={volumeCl}
					oninput={(e) => setVolumeCl(+e.currentTarget.value)}
					class="w-full rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 text-base font-bold tabular-nums text-on-surface"
					aria-label="Volume en centilitres"
				/>
			</label>
			<label class="block">
				<span class="mb-1 block text-[10px] font-bold text-outline uppercase">Degré (%)</span>
				<input
					type="number"
					inputmode="decimal"
					min="0"
					max="100"
					step="0.5"
					value={drink.degre}
					oninput={(e) => setDegre(+e.currentTarget.value)}
					class="w-full rounded-xl border border-surface-container bg-surface-container-low px-3 py-2.5 text-base font-bold tabular-nums text-on-surface"
					aria-label="Degré d'alcool"
				/>
			</label>
		</div>
		<label class="block">
			<span class="mb-1 block text-[10px] font-bold text-outline uppercase">Heure</span>
			<input
				type="time"
				value={drink.heure}
				onchange={(e) => updateDrink(drink.id, { heure: e.currentTarget.value })}
				class="w-full rounded-xl border border-surface-container bg-white px-3 py-2.5 text-base font-semibold text-on-surface"
				aria-label="Heure de consommation"
			/>
		</label>
	</div>
	<button
		type="button"
		onclick={() => removeDrink(drink.id)}
		class="shrink-0 p-2 text-outline-variant hover:text-error"
		aria-label="Supprimer ce verre"
	>
		<span class="material-symbols-outlined text-sm">close</span>
	</button>
</div>
