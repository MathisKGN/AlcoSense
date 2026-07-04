<script lang="ts">
	import { drinks, resetDrinks } from '$lib/stores.svelte';
	import DrinkItem from './DrinkItem.svelte';
</script>

<section class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-on-surface">Consommations</h2>
		<div class="flex items-center gap-3">
			<span
				class="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-primary"
				data-testid="drink-count">{drinks.length}</span
			>
			<button
				type="button"
				onclick={resetDrinks}
				class="p-2 text-outline-variant transition-colors hover:text-error"
				aria-label="Réinitialiser les consommations"
			>
				<span class="material-symbols-outlined">refresh</span>
			</button>
		</div>
	</div>

	<div class="space-y-3">
		{#if drinks.length === 0}
			<div
				class="rounded-2xl border-2 border-dashed border-surface-container bg-white/50 py-10 text-center text-sm text-outline italic opacity-40"
				data-testid="empty-state"
			>
				Aucune boisson ajoutée
			</div>
		{:else}
			{#each drinks as drink (drink.id)}
				<DrinkItem {drink} />
			{/each}
		{/if}
	</div>
</section>
