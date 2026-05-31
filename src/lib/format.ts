const FOUR_HOURS_MIN = 4 * 60;

export function formatMinuteOfDay(min: number): string {
	const m = ((Math.round(min) % 1440) + 1440) % 1440;
	const h = Math.floor(m / 60);
	const mm = m % 60;
	return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatVolumeCl(volumeMl: number): string {
	const cl = volumeMl / 10;
	const text = Number.isInteger(cl) ? String(cl) : cl.toFixed(1).replace('.', ',');
	return `${text} cl`;
}

export function formatDegre(degre: number): string {
	const text = Number.isInteger(degre) ? String(degre) : degre.toFixed(1).replace('.', ',');
	return `${text} %`;
}

export function chartTickStepMin(spanMin: number): 15 | 30 {
	return spanMin <= FOUR_HOURS_MIN ? 15 : 30;
}

export interface ChartTick {
	tMin: number;
	label: string;
	ratio: number;
}

export function generateChartTicks(
	fromMin: number,
	toMin: number,
	stepMin: 15 | 30
): ChartTick[] {
	const span = Math.max(1, toMin - fromMin);
	const first = Math.ceil(fromMin / stepMin) * stepMin;
	const ticks: ChartTick[] = [];
	for (let t = first; t <= toMin; t += stepMin) {
		ticks.push({
			tMin: t,
			label: formatMinuteOfDay(t),
			ratio: (t - fromMin) / span
		});
	}
	return ticks;
}
