<script lang="ts">
	import { DRINK_PRESETS, type Drink } from '$lib/types';
	import { updateDrink, removeDrink } from '$lib/stores.svelte';

	let { drink }: { drink: Drink } = $props();
	const icon = $derived(DRINK_PRESETS[drink.type].icon);
	const label = $derived(DRINK_PRESETS[drink.type].label);
</script>

<div class="flex items-center gap-3 rounded-2xl border border-surface-container bg-white p-4 shadow-sm">
	<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
		<span class="material-symbols-outlined">{icon}</span>
	</div>
	<div class="min-w-0 flex-1">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0">
				<span class="block truncate text-sm font-bold">{label}</span>
				<div class="mt-1 flex items-center gap-1 text-[10px] font-bold text-outline uppercase">
					<input
						type="number"
						min="0"
						value={drink.volume}
						oninput={(e) => updateDrink(drink.id, { volume: +e.currentTarget.value })}
						class="w-12 rounded bg-surface-container-low px-1 py-0.5 text-on-surface focus:ring-0"
						aria-label="Volume en millilitres"
					/>
					<span>ml •</span>
					<input
						type="number"
						min="0"
						step="0.5"
						value={drink.degre}
						oninput={(e) => updateDrink(drink.id, { degre: +e.currentTarget.value })}
						class="w-12 rounded bg-surface-container-low px-1 py-0.5 text-on-surface focus:ring-0"
						aria-label="Degré d'alcool en pourcentage"
					/>
					<span>%</span>
				</div>
			</div>
			<input
				type="time"
				value={drink.heure}
				onchange={(e) => updateDrink(drink.id, { heure: e.currentTarget.value })}
				class="rounded border-none bg-primary-container/10 px-2 py-1 text-[11px] font-bold text-primary focus:ring-0"
				aria-label="Heure de consommation"
			/>
		</div>
	</div>
	<button
		type="button"
		onclick={() => removeDrink(drink.id)}
		class="p-2 text-outline-variant transition-colors hover:text-error"
		aria-label="Supprimer ce verre"
	>
		<span class="material-symbols-outlined text-sm">close</span>
	</button>
</div>
