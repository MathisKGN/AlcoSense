<script lang="ts">
	import { formatMinuteOfDay } from '$lib/format';

	let {
		bac,
		limit,
		driveMin,
		nowMin
	}: { bac: number; limit: number; driveMin: number; nowMin: number } = $props();

	const display = $derived(bac.toFixed(2).replace('.', ','));
	const limitText = $derived(limit.toFixed(1).replace('.', ','));

	type Status = 'over' | 'soon' | 'near' | 'safe';
	const status: Status = $derived(
		bac >= limit ? 'over' : driveMin > nowMin ? 'soon' : bac >= 0.8 * limit ? 'near' : 'safe'
	);

	const ui = $derived.by(() => {
		switch (status) {
			case 'over':
				return {
					accent: 'text-secondary',
					icon: 'warning',
					title: 'Conduite interdite'
				};
			case 'soon':
				return {
					accent: 'text-warning',
					icon: 'hourglass_top',
					title: 'Absorption en cours'
				};
			case 'near':
				return {
					accent: 'text-warning',
					icon: 'warning',
					title: 'Proche du seuil'
				};
			default:
				return {
					accent: 'text-primary',
					icon: 'check_circle',
					title: 'Apte à la conduite'
				};
		}
	});

	const canDriveNow = $derived(driveMin <= nowMin);
	const remaining = $derived(Math.max(0, driveMin - nowMin));
	const driveClock = $derived(formatMinuteOfDay(driveMin));
	const remainingLabel = $derived(
		`${Math.floor(remaining / 60)} h ${String(remaining % 60).padStart(2, '0')} min`
	);
</script>

<section
	class="glass-card flex items-center gap-4 rounded-2xl px-4 py-3 shadow-sm"
	aria-live="polite"
>
	<div class="min-w-[88px] text-center">
		<p class="text-[10px] font-bold tracking-wider text-outline uppercase">Estimation</p>
		<p class="text-4xl leading-none font-thin tabular-nums {ui.accent}">{display}</p>
		<p class="text-[10px] font-semibold text-outline uppercase">g/L</p>
	</div>
	<div class="min-w-0 flex-1">
		<div class="mb-1 flex items-center gap-2">
			<span class="material-symbols-outlined text-lg {ui.accent}">{ui.icon}</span>
			<span class="text-sm font-bold {ui.accent}">{ui.title}</span>
		</div>
		<p class="text-[11px] text-outline">Limite {limitText} g/L</p>
		<p class="mt-1 text-sm font-bold text-on-surface">
			{#if canDriveNow}
				Tu peux conduire
			{:else}
				Conduite possible à {driveClock}
				<span class="block text-[11px] font-semibold text-outline">dans {remainingLabel}</span>
			{/if}
		</p>
	</div>
</section>
