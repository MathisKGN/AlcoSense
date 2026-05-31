<script lang="ts">
	let {
		bac,
		limit,
		driveMin,
		nowMin
	}: { bac: number; limit: number; driveMin: number; nowMin: number } = $props();

	const display = $derived(bac.toFixed(2).replace('.', ','));
	const limitText = $derived(limit.toFixed(1).replace('.', ','));

	// 3 zones: over (>= limit) / soon (under now but peak will exceed) /
	// near (>= 80% of limit) / safe.
	type Status = 'over' | 'soon' | 'near' | 'safe';
	const status: Status = $derived(
		bac >= limit ? 'over' : driveMin > nowMin ? 'soon' : bac >= 0.8 * limit ? 'near' : 'safe'
	);

	const ui = $derived.by(() => {
		switch (status) {
			case 'over':
				return {
					number: 'text-secondary',
					card: 'border-secondary/20 bg-secondary-container/10',
					text: 'text-secondary',
					icon: 'warning',
					title: 'Conduite interdite',
					desc: `Seuil de ${limitText} g/L dépassé`
				};
			case 'soon':
				return {
					number: 'text-warning',
					card: 'border-warning/20 bg-warning-container/10',
					text: 'text-warning',
					icon: 'hourglass_top',
					title: 'Absorption en cours',
					desc: 'Estimation encore en hausse'
				};
			case 'near':
				return {
					number: 'text-warning',
					card: 'border-warning/20 bg-warning-container/10',
					text: 'text-warning',
					icon: 'warning',
					title: 'Proche du seuil',
					desc: `Limite légale : ${limitText} g/L`
				};
			default:
				return {
					number: 'text-on-surface',
					card: 'border-primary/20 bg-primary-container/10',
					text: 'text-on-primary-container',
					icon: 'check_circle',
					title: 'Apte à la conduite',
					desc: `Limite légale : ${limitText} g/L`
				};
		}
	});

	const canDriveNow = $derived(driveMin <= nowMin);
	const remaining = $derived(Math.max(0, driveMin - nowMin));
	const driveClock = $derived.by(() => {
		const m = ((driveMin % 1440) + 1440) % 1440;
		return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
	});
	const remainingLabel = $derived(`${Math.floor(remaining / 60)} h ${String(remaining % 60).padStart(2, '0')} min`);
</script>

<section class="flex flex-col items-center py-6 text-center">
	<div class="mb-2 inline-flex items-center gap-2">
		<span class="pulse-dot h-2 w-2 rounded-full bg-primary"></span>
		<span class="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">Estimation directe</span>
	</div>
	<h1
		class="text-[96px] leading-none font-thin transition-colors duration-700 sm:text-[120px] {ui.number}"
		style="letter-spacing: -0.05em;"
	>
		{display}
	</h1>
	<span class="mt-2 block text-[13px] font-semibold tracking-[0.2em] text-outline uppercase"
		>g/L de sang</span
	>
</section>

<div
	class="flex items-center gap-4 rounded-full border px-6 py-4 shadow-sm transition-all duration-500 {ui.card}"
>
	<span class="material-symbols-outlined text-2xl {ui.text}">{ui.icon}</span>
	<div class="flex-1">
		<p class="mb-1 text-sm leading-none font-bold {ui.text}">{ui.title}</p>
		<p class="text-[11px] opacity-70 {ui.text}">{ui.desc}</p>
	</div>
</div>

<p class="px-2 text-center text-sm font-bold text-on-surface">
	{#if canDriveNow}
		Tu peux conduire
	{:else}
		Tu peux conduire à {driveClock}
		<span class="block text-[11px] font-semibold text-outline">dans {remainingLabel}</span>
	{/if}
</p>
