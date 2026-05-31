<script lang="ts">
	import { sampleCurve, type CurvePoint } from '$lib/widmark';
	import type { Profile, StomachState } from '$lib/types';

	let {
		drinks,
		profile,
		stomach,
		limit,
		nowMin,
		driveMin
	}: {
		drinks: import('$lib/types').Drink[];
		profile: Profile;
		stomach: StomachState;
		limit: number;
		nowMin: number;
		driveMin: number;
	} = $props();

	// End of the window: drive time + 20 min margin, min 60 min span.
	const toMin = $derived(driveMin > nowMin ? driveMin + 20 : nowMin + 60);
	const points = $derived<CurvePoint[]>(
		sampleCurve(drinks, profile, stomach, nowMin, toMin, 40)
	);
	const maxBac = $derived(Math.max(limit, ...points.map((p) => p.bac), 0.1));

	// Map a point to SVG viewBox 0..100 (x left→right, y 90 bottom = 0).
	function x(p: CurvePoint): number {
		const span = toMin - nowMin;
		return span === 0 ? 0 : (p.minutesFromNow / span) * 100;
	}
	function y(bac: number): number {
		return 90 - (bac / maxBac) * 80;
	}

	const linePath = $derived(
		points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p)},${y(p.bac)}`).join(' ')
	);
	const areaPath = $derived(`${linePath} L100,90 L0,90 Z`);
	const limitY = $derived(y(limit));

	const remainingMin = $derived(Math.max(0, driveMin - nowMin));
	const timer = $derived(
		remainingMin === 0
			? 'Sous le seuil'
			: `${String(Math.floor(remainingMin / 60)).padStart(2, '0')}h${String(
					Math.round(remainingMin % 60)
				).padStart(2, '0')} restant`
	);
</script>

<section class="glass-card overflow-hidden rounded-3xl p-6 shadow-sm">
	<div class="mb-6 flex items-center justify-between">
		<h3 class="text-[13px] font-bold tracking-wider text-outline uppercase">Projection temporelle</h3>
		<span class="text-[11px] font-bold text-primary">{timer}</span>
	</div>
	<div class="relative mb-4 h-40 w-full">
		<svg class="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
			<defs>
				<linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#006c49" stop-opacity="0.2" />
					<stop offset="100%" stop-color="#006c49" stop-opacity="0" />
				</linearGradient>
			</defs>
			<line x1="0" y1="90" x2="100" y2="90" class="stroke-surface-container" stroke-width="0.5" />
			<path d={areaPath} fill="url(#chartGradient)" class="opacity-50" />
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
		</svg>
		<div class="absolute -bottom-6 left-0 text-[9px] font-bold text-outline uppercase">Maintenant</div>
		<div class="absolute right-0 -bottom-6 text-[9px] font-bold text-outline uppercase">Sobriété</div>
	</div>
</section>
