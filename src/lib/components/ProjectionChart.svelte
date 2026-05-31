<script lang="ts">
	import type { ProjectionTimeline } from '$lib/widmark';
	import { formatMinuteOfDay, generateChartTicks, chartTickStepMin } from '$lib/format';

	let { timeline }: { timeline: ProjectionTimeline } = $props();

	const { fromMin, nowMin, firstDrinkMin, driveMin, limit, toMin, points, peakBac } =
		$derived(timeline);

	const span = $derived(Math.max(1, toMin - fromMin));
	const maxY = $derived(Math.max(limit * 1.15, peakBac, 0.01));
	const stepMin = $derived(chartTickStepMin(span));
	const ticks = $derived(generateChartTicks(fromMin, toMin, stepMin));
	const sparseTickLabels = $derived(ticks.length > 8);

	function xFromStart(minutesFromStart: number): number {
		return (minutesFromStart / span) * 100;
	}
	function xAt(tMin: number): number {
		return ((tMin - fromMin) / span) * 100;
	}
	function y(bac: number): number {
		return 90 - (bac / maxY) * 80;
	}

	function bacAtTMin(tMin: number): number {
		if (points.length === 0) return 0;
		if (tMin <= points[0].tMin) return points[0].bac;
		const last = points[points.length - 1];
		if (tMin >= last.tMin) return last.bac;
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1];
			const b = points[i];
			if (tMin <= b.tMin) {
				const spanT = b.tMin - a.tMin;
				if (spanT <= 0) return b.bac;
				const frac = (tMin - a.tMin) / spanT;
				return a.bac + frac * (b.bac - a.bac);
			}
		}
		return 0;
	}

	function markerCy(tMin: number): number {
		return y(bacAtTMin(tMin));
	}

	const linePath = $derived(
		points
			.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFromStart(p.minutesFromStart)},${y(p.bac)}`)
			.join(' ')
	);
	const limitY = $derived(y(limit));

	const markers = $derived.by(() => {
		const list = [
			{ key: 'start', tMin: firstDrinkMin, label: 'Début', sub: formatMinuteOfDay(firstDrinkMin) },
			{ key: 'now', tMin: nowMin, label: 'Maintenant', sub: formatMinuteOfDay(nowMin) }
		];
		if (driveMin !== null) {
			list.push({
				key: 'drive',
				tMin: driveMin,
				label: driveMin <= nowMin ? 'Sous le seuil' : 'Conduite',
				sub: formatMinuteOfDay(driveMin)
			});
		}
		return list;
	});
</script>

<section class="glass-card overflow-hidden rounded-3xl p-6 shadow-sm">
	<div class="mb-4">
		<h3 class="text-[13px] font-bold tracking-wider text-outline uppercase">Courbe dans le temps</h3>
		<p class="text-[11px] text-outline">Limite légale {limit.toFixed(1).replace('.', ',')} g/L</p>
	</div>
	<div class="relative mb-8 h-44 w-full">
		<svg
			class="h-full w-full overflow-visible"
			preserveAspectRatio="none"
			viewBox="0 0 100 100"
		>
			{#each ticks as tick (tick.tMin)}
				<line
					x1={tick.ratio * 100}
					y1="90"
					x2={tick.ratio * 100}
					y2="88"
					class="stroke-surface-container"
					stroke-width="0.5"
				/>
			{/each}
			<line x1="0" y1="90" x2="100" y2="90" class="stroke-surface-container" stroke-width="0.5" />
			<path
				d={linePath}
				class="fill-none stroke-primary"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<line
				x1="0"
				y1={limitY}
				x2="100"
				y2={limitY}
				class="stroke-secondary/40"
				stroke-dasharray="2 2"
				stroke-width="1"
			/>
			{#each markers as m (m.key)}
				<line
					x1={xAt(m.tMin)}
					y1="12"
					x2={xAt(m.tMin)}
					y2="90"
					class="stroke-primary/25"
					stroke-width="0.75"
				/>
				<circle cx={xAt(m.tMin)} cy={markerCy(m.tMin)} r="2.5" class="fill-primary" />
			{/each}
		</svg>
		<div class="pointer-events-none absolute inset-x-0 -bottom-7 flex justify-between text-[8px] font-bold text-outline">
			{#each ticks as tick, i (tick.tMin)}
				{#if !sparseTickLabels || i % 2 === 0 || i === ticks.length - 1}
					<span style="left: {tick.ratio * 100}%" class="absolute -translate-x-1/2">{tick.label}</span>
				{/if}
			{/each}
		</div>
	</div>
	<ul class="mt-2 flex flex-wrap gap-3 text-[10px] font-bold text-outline uppercase">
		{#each markers as m (m.key)}
			<li><span class="text-on-surface">{m.label}</span> {m.sub}</li>
		{/each}
	</ul>
</section>
