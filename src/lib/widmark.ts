import {
	ETHANOL_DENSITY,
	ELIMINATION_RATE,
	WIDMARK_R,
	STOMACH_RISE_MIN,
	legalLimit,
	type Drink,
	type Profile,
	type StomachState
} from './types';

/** Pure alcohol mass (g) for a drink. */
export function alcoholGrams(volumeMl: number, degre: number): number {
	return volumeMl * (degre / 100) * ETHANOL_DENSITY;
}

/** Linear absorption fraction in [0, 1]. */
export function fractionAbsorbed(elapsedMin: number, riseMin: number): number {
	if (elapsedMin <= 0) return 0;
	if (elapsedMin >= riseMin) return 1;
	return elapsedMin / riseMin;
}

interface Absorbed {
	alcoholG: number;
	startMin: number; // minutes-of-day the drink was consumed
}

/** Elimination per minute (g/L). */
const ELIM_PER_MIN = ELIMINATION_RATE / 60;

/**
 * Raw absorbed BAC (g/L) at instant `tMin`, summed across drinks, BEFORE
 * elimination. Monotonic non-decreasing in `tMin`.
 */
function rawAbsorbed(
	items: Absorbed[],
	poids: number,
	r: number,
	riseMin: number,
	tMin: number
): number {
	let sum = 0;
	for (const it of items) {
		const cMax = it.alcoholG / (poids * r);
		sum += cMax * fractionAbsorbed(tMin - it.startMin, riseMin);
	}
	return sum;
}

/**
 * Forward-integrate the BAC trajectory minute-by-minute from the first drink
 * through `toMin`, clamping at 0 at every step: each minute adds the
 * newly-absorbed alcohol and subtracts elimination. Clamping every step (rather
 * than subtracting `β × total_elapsed` once) is what stops elimination from
 * "banking" credit during sober gaps — a closed-form `max(0, Σc − β·t)` would
 * wrongly report 0 for a drink taken hours after an earlier, already-eliminated
 * one. Single pass — O(span) — shared by every query below. Returns the bac at
 * each integer minute, indexed from `firstStart`.
 */
function trajectory(
	items: Absorbed[],
	poids: number,
	r: number,
	riseMin: number,
	toMin: number
): { firstStart: number; bac: number[] } {
	const firstStart = Math.min(...items.map((i) => i.startMin));
	const bac: number[] = [0]; // index 0 → minute firstStart
	let prev = 0;
	for (let t = firstStart + 1; t <= toMin; t++) {
		const cur = rawAbsorbed(items, poids, r, riseMin, t);
		bac.push(Math.max(0, bac[bac.length - 1] + (cur - prev) - ELIM_PER_MIN));
		prev = cur;
	}
	return { firstStart, bac };
}

/** BAC (g/L) at instant `tMin` (rounded to the whole minute). */
export function bacAtMinute(
	items: Absorbed[],
	poids: number,
	r: number,
	riseMin: number,
	tMin: number
): number {
	if (items.length === 0) return 0;
	const end = Math.round(tMin);
	const { firstStart, bac } = trajectory(items, poids, r, riseMin, end);
	const idx = end - firstStart;
	return idx <= 0 ? 0 : bac[idx];
}

// --- Date-aware façade (UI layer) -------------------------------------------

const DAY = 24 * 60;

function hhmmToMin(hhmm: string): number {
	const [h, m] = hhmm.split(':').map(Number);
	return h * 60 + m;
}

/**
 * Resolve a wall-clock "HH:MM" to an ABSOLUTE minute relative to `nowMin`
 * (minutes-of-day "now"): the most recent occurrence <= now. A time later than
 * `nowMin` is interpreted as yesterday evening (may return a negative minute),
 * which makes crossing midnight correct. Assumes drinks are within the last 24h.
 */
export function resolveDrinkMinute(heure: string, nowMin: number): number {
	const drinkMin = hhmmToMin(heure);
	let delta = nowMin - drinkMin;
	if (delta < 0) delta += DAY; // the time is in the future today → it was yesterday
	return nowMin - delta;
}

function toAbsorbed(drinks: Drink[], nowMin: number): Absorbed[] {
	return drinks.map((d) => ({
		alcoholG: alcoholGrams(d.volume, d.degre),
		startMin: resolveDrinkMinute(d.heure, nowMin)
	}));
}

export function bacNow(
	drinks: Drink[],
	profile: Profile,
	stomach: StomachState,
	now: Date
): number {
	const nowMin = now.getHours() * 60 + now.getMinutes();
	return bacAtMinute(
		toAbsorbed(drinks, nowMin),
		profile.poids,
		WIDMARK_R[profile.sexe],
		STOMACH_RISE_MIN[stomach],
		nowMin
	);
}

/**
 * The absolute minute (>= nowMin) AFTER WHICH the BAC stays strictly under the
 * legal limit: the last minute in the next 24h where BAC >= limit, plus 1.
 * Returns `nowMin` if already durably below. Returns `null` if still at or over
 * the limit at the end of the 24h window (no safe time to announce).
 */
export function driveTimeMinute(
	drinks: Drink[],
	profile: Profile,
	stomach: StomachState,
	nowMin: number
): number | null {
	const items = toAbsorbed(drinks, nowMin);
	if (items.length === 0) return nowMin;
	const r = WIDMARK_R[profile.sexe];
	const rise = STOMACH_RISE_MIN[stomach];
	const limit = legalLimit(profile.jeunePermis);
	const horizon = nowMin + DAY;
	const { firstStart, bac } = trajectory(items, profile.poids, r, rise, horizon);
	let lastOver = -1;
	for (let t = nowMin; t <= horizon; t++) {
		if (bac[t - firstStart] >= limit) lastOver = t;
	}
	if (lastOver === -1) return nowMin;
	const candidate = lastOver + 1;
	if (candidate > horizon) return null;
	if (bac[candidate - firstStart] >= limit) return null;
	return candidate;
}

export interface CurvePoint {
	minutesFromNow: number;
	bac: number;
}

/**
 * Sample the BAC curve from `nowMin` to `toMin` for charting.
 * `steps` = number of segments; returns steps+1 points.
 */
export function sampleCurve(
	drinks: Drink[],
	profile: Profile,
	stomach: StomachState,
	nowMin: number,
	toMin: number,
	steps: number
): CurvePoint[] {
	const items = toAbsorbed(drinks, nowMin);
	const r = WIDMARK_R[profile.sexe];
	const rise = STOMACH_RISE_MIN[stomach];
	const span = Math.max(1, toMin - nowMin);
	const traj = items.length
		? trajectory(items, profile.poids, r, rise, Math.round(toMin))
		: null;
	const points: CurvePoint[] = [];
	for (let i = 0; i <= steps; i++) {
		const t = nowMin + (span * i) / steps;
		const idx = traj ? Math.round(t) - traj.firstStart : -1;
		points.push({
			minutesFromNow: t - nowMin,
			bac: traj && idx >= 0 && idx < traj.bac.length ? traj.bac[idx] : 0
		});
	}
	return points;
}

export interface TimelinePoint {
	tMin: number;
	minutesFromStart: number;
	bac: number;
}

export interface ProjectionTimeline {
	fromMin: number;
	nowMin: number;
	firstDrinkMin: number;
	/** null = still at/above limit within the next 24h (no time to show). */
	driveMin: number | null;
	limit: number;
	toMin: number;
	points: TimelinePoint[];
	peakBac: number;
}

const TIMELINE_MARGIN_MIN = 10;
const SOBER_SPAN_MIN = 60;
const TIMELINE_STEPS = 48;

export function firstDrinkMinute(drinks: Drink[], nowMin: number): number {
	if (drinks.length === 0) return nowMin;
	return Math.min(...drinks.map((d) => resolveDrinkMinute(d.heure, nowMin)));
}

export function buildProjectionTimeline(
	drinks: Drink[],
	profile: Profile,
	stomach: StomachState,
	nowMin: number
): ProjectionTimeline {
	const limit = legalLimit(profile.jeunePermis);
	const fdMin = firstDrinkMinute(drinks, nowMin);
	const fromMin = drinks.length === 0 ? nowMin : fdMin;
	const driveMin = driveTimeMinute(drinks, profile, stomach, nowMin);

	let toMin: number;
	if (drinks.length === 0) {
		toMin = nowMin + SOBER_SPAN_MIN;
	} else if (driveMin === null) {
		toMin = nowMin + DAY;
	} else if (driveMin > nowMin) {
		const items = toAbsorbed(drinks, nowMin);
		const r = WIDMARK_R[profile.sexe];
		const rise = STOMACH_RISE_MIN[stomach];
		const bacAtDrive = bacAtMinute(items, profile.poids, r, rise, driveMin);
		toMin = bacAtDrive >= limit ? driveMin + TIMELINE_MARGIN_MIN : driveMin;
	} else {
		toMin = nowMin + SOBER_SPAN_MIN;
	}

	const items = toAbsorbed(drinks, nowMin);
	const r = WIDMARK_R[profile.sexe];
	const rise = STOMACH_RISE_MIN[stomach];
	const span = Math.max(1, toMin - fromMin);
	const traj = items.length
		? trajectory(items, profile.poids, r, rise, Math.round(toMin))
		: null;
	const points: TimelinePoint[] = [];
	for (let i = 0; i <= TIMELINE_STEPS; i++) {
		const t = fromMin + (span * i) / TIMELINE_STEPS;
		const idx = traj ? Math.round(t) - traj.firstStart : -1;
		points.push({
			tMin: t,
			minutesFromStart: t - fromMin,
			bac: traj && idx >= 0 && idx < traj.bac.length ? traj.bac[idx] : 0
		});
	}
	let peakBac = 0;
	if (traj) {
		const end = Math.round(toMin);
		for (let t = Math.round(fromMin); t <= end; t++) {
			const idx = t - traj.firstStart;
			if (idx >= 0 && idx < traj.bac.length) peakBac = Math.max(peakBac, traj.bac[idx]);
		}
	}

	return {
		fromMin,
		nowMin,
		firstDrinkMin: fdMin,
		driveMin,
		limit,
		toMin,
		points,
		peakBac
	};
}
