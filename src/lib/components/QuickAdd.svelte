<script lang="ts">
	import { DRINK_PRESETS, type DrinkType } from '$lib/types';
	import { addDrink } from '$lib/stores.svelte';

	const types = Object.keys(DRINK_PRESETS) as DrinkType[];
</script>

<div class="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-4">
	{#each types as type (type)}
		<button
			type="button"
			onclick={() => addDrink(type)}
			class="group flex min-w-[80px] flex-col items-center gap-2 rounded-2xl border border-surface-container bg-white p-4 shadow-sm transition-transform active:scale-95"
		>
			<span class="material-symbols-outlined text-outline group-hover:text-primary"
				>{DRINK_PRESETS[type].icon}</span
			>
			<span class="text-[10px] font-bold uppercase">{DRINK_PRESETS[type].label}</span>
		</button>
	{/each}
</div>
