import { describe, it, expect } from 'vitest';
import {
	alcoholGrams,
	fractionAbsorbed,
	bacAtMinute,
	resolveDrinkMinute,
	driveTimeMinute,
	bacNow,
	sampleCurve,
	buildProjectionTimeline,
	firstDrinkMinute
} from './widmark';
import type { Drink, Profile } from './types';

const HOMME: Profile = { poids: 75, sexe: 'homme', jeunePermis: false };
const FEMME: Profile = { poids: 75, sexe: 'femme', jeunePermis: false };

function beers(n: number, heure = '10:00'): Drink[] {
	return Array.from({ length: n }, (_, i) => ({
		id: String(i),
		type: 'biere' as const,
		volume: 250,
		degre: 5,
		heure
	}));
}

describe('alcoholGrams', () => {
	it('computes pure alcohol mass with density 0.789', () => {
		// 250 ml beer at 5% = 250 * 0.05 * 0.789 = 9.8625 g
		expect(alcoholGrams(250, 5)).toBeCloseTo(9.8625, 4);
	});
});

describe('fractionAbsorbed', () => {
	it('is 0 before consumption', () => {
		expect(fractionAbsorbed(-5, 30)).toBe(0);
		expect(fractionAbsorbed(0, 30)).toBe(0);
	});
	it('rises linearly during the rise window', () => {
		expect(fractionAbsorbed(15, 30)).toBeCloseTo(0.5, 5);
	});
	it('is fully absorbed at/after the rise duration', () => {
		expect(fractionAbsorbed(30, 30)).toBe(1);
		expect(fractionAbsorbed(120, 30)).toBe(1);
	});
});

describe('bacAtMinute', () => {
	const r = 0.7; // homme
	const poids = 75;
	const rise = 30; // stomach vide

	it('returns 0 for an empty drink list', () => {
		expect(bacAtMinute([], poids, r, rise, 600)).toBe(0);
	});

	it('one beer fully absorbed, 30 min later ≈ 0.11 g/L', () => {
		// c_max = 9.8625 / (75*0.7) = 0.187857 ; elimination over 0.5h = 0.075
		const items = [{ alcoholG: 9.8625, startMin: 600 }];
		expect(bacAtMinute(items, poids, r, rise, 630)).toBeCloseTo(0.1129, 3);
	});

	it('is 0 at the exact moment of the first drink', () => {
		const items = [{ alcoholG: 9.8625, startMin: 600 }];
		expect(bacAtMinute(items, poids, r, rise, 600)).toBe(0);
	});

	it('never goes negative', () => {
		const items = [{ alcoholG: 9.8625, startMin: 600 }];
		// hours later, fully eliminated
		expect(bacAtMinute(items, poids, r, rise, 600 + 10 * 60)).toBe(0);
	});

	it('does not "bank" elimination during a sober gap (safety: no under-estimate)', () => {
		// beer at 18:00 (eliminated within ~1.5 h), then beer at 23:00, now 23:30.
		// A closed-form Σc − β·(since first drink) would wrongly give 0; forward
		// integration clamps at 0 during the gap so the late beer still registers.
		const items = [
			{ alcoholG: 9.8625, startMin: 18 * 60 },
			{ alcoholG: 9.8625, startMin: 23 * 60 }
		];
		expect(bacAtMinute(items, poids, r, rise, 23 * 60 + 30)).toBeCloseTo(0.1129, 2);
	});

	it('a drink in the future contributes 0 (spec: t < 0)', () => {
		const items = [{ alcoholG: 9.8625, startMin: 700 }];
		expect(bacAtMinute(items, poids, r, rise, 600)).toBe(0);
	});

	it('uses the lower coefficient for women → higher BAC', () => {
		// same dose, r=0.6 (femme) vs r=0.7 (homme); compare at full absorption
		const items = [{ alcoholG: 9.8625, startMin: 600 }];
		const homme = bacAtMinute(items, 75, 0.7, 30, 630);
		const femme = bacAtMinute(items, 75, 0.6, 30, 630);
		expect(femme).toBeGreaterThan(homme);
	});

	it('slower rise (fuller stomach) → lower BAC mid-absorption', () => {
		const items = [{ alcoholG: 9.8625, startMin: 600 }];
		const vide = bacAtMinute(items, poids, r, 30, 615); // fully absorbed
		const grignote = bacAtMinute(items, poids, r, 60, 615); // 15/60 absorbed
		const repas = bacAtMinute(items, poids, r, 90, 615); // 15/90 absorbed
		expect(vide).toBeGreaterThan(grignote);
		expect(grignote).toBeGreaterThan(repas);
	});
});

describe('resolveDrinkMinute', () => {
	it('keeps a drink earlier today as a positive absolute minute', () => {
		expect(resolveDrinkMinute('10:00', 630)).toBe(600);
	});
	it('keeps a drink at the current minute', () => {
		expect(resolveDrinkMinute('10:30', 630)).toBe(630);
	});
	it('places a "later" time as yesterday evening (crosses midnight)', () => {
		// now 00:30 (nowMin 30), drink 23:30 → -30 (yesterday)
		expect(resolveDrinkMinute('23:30', 30)).toBe(-30);
	});
});

describe('driveTimeMinute', () => {
	it('returns now when durably below the limit', () => {
		// one beer peaks ~0.19 < 0.5 → safe and stays safe
		expect(driveTimeMinute(beers(1), HOMME, 'vide', 600)).toBe(600);
	});

	it('returns the moment after which BAC stays under the limit (heavy session)', () => {
		// 5 shots at 10:00 → c_max ≈ 0.902, back under 0.5 ≈ 161 min later
		const drinks: Drink[] = Array.from({ length: 5 }, (_, i) => ({
			id: String(i),
			type: 'shot' as const,
			volume: 30,
			degre: 40,
			heure: '10:00'
		}));
		const t = driveTimeMinute(drinks, HOMME, 'vide', 600);
		expect(t - 600).toBeGreaterThan(155);
		expect(t - 600).toBeLessThan(170);
	});

	it('is later for a young driver (limit 0.2 vs 0.5)', () => {
		// 2 beers peak ~0.376: over 0.2 but under 0.5
		const young: Profile = { ...HOMME, jeunePermis: true };
		expect(driveTimeMinute(beers(2), HOMME, 'vide', 600)).toBe(600);
		expect(driveTimeMinute(beers(2), young, 'vide', 600)).toBeGreaterThan(600);
	});

	it('accounts for the rise phase: not "safe" right after drinking heavily', () => {
		// 5 shots just consumed at nowMin: current BAC ~0 but peak will exceed 0.5
		const drinks: Drink[] = Array.from({ length: 5 }, (_, i) => ({
			id: String(i),
			type: 'shot' as const,
			volume: 30,
			degre: 40,
			heure: '10:00'
		}));
		expect(driveTimeMinute(drinks, HOMME, 'vide', 600)).toBeGreaterThan(600);
	});

	it('returns null when still at or over the limit after the 24h horizon', () => {
		const drinks: Drink[] = Array.from({ length: 30 }, (_, i) => ({
			id: String(i),
			type: 'shot' as const,
			volume: 30,
			degre: 40,
			heure: '22:00'
		}));
		expect(driveTimeMinute(drinks, HOMME, 'vide', 22 * 60)).toBeNull();
	});
});

describe('bacNow', () => {
	it('is 0 with no drinks', () => {
		expect(bacNow([], HOMME, 'vide', new Date(2026, 0, 1, 10, 30))).toBe(0);
	});

	it('computes a positive BAC across midnight (drink 23:30, now 00:30)', () => {
		const drinks: Drink[] = [{ id: '1', type: 'biere', volume: 250, degre: 5, heure: '23:30' }];
		const bac = bacNow(drinks, HOMME, 'vide', new Date(2026, 0, 2, 0, 30));
		expect(bac).toBeGreaterThan(0);
	});

	it('gives women a higher BAC than men for the same dose', () => {
		const now = new Date(2026, 0, 1, 10, 30);
		expect(bacNow(beers(1), FEMME, 'vide', now)).toBeGreaterThan(
			bacNow(beers(1), HOMME, 'vide', now)
		);
	});
});

describe('sampleCurve', () => {
	it('returns steps+1 points with correct bounds', () => {
		const pts = sampleCurve(beers(2), HOMME, 'vide', 600, 720, 40);
		expect(pts).toHaveLength(41);
		expect(pts[0].minutesFromNow).toBe(0);
		expect(pts[40].minutesFromNow).toBeCloseTo(120, 5);
	});
});

describe('firstDrinkMinute', () => {
	it('returns earliest resolved drink minute', () => {
		const nowMin = 20 * 60;
		const drinks = [
			{ id: '1', type: 'biere' as const, volume: 250, degre: 5, heure: '19:00' },
			{ id: '2', type: 'biere' as const, volume: 250, degre: 5, heure: '18:30' }
		];
		expect(firstDrinkMinute(drinks, nowMin)).toBe(18 * 60 + 30);
	});
});

describe('buildProjectionTimeline', () => {
	it('starts window at first drink, not now', () => {
		const nowMin = 20 * 60;
		const drinks = beers(2, '18:00');
		const tl = buildProjectionTimeline(drinks, HOMME, 'vide', nowMin);
		expect(tl.fromMin).toBe(18 * 60);
		expect(tl.fromMin).toBeLessThan(nowMin);
		expect(tl.nowMin).toBe(nowMin);
	});

	it('ends at or below limit at toMin when drive is in the future', () => {
		const nowMin = 18 * 60;
		const drinks = Array.from({ length: 6 }, (_, i) => ({
			id: String(i),
			type: 'shot' as const,
			volume: 30,
			degre: 40,
			heure: '17:00'
		}));
		const tl = buildProjectionTimeline(drinks, HOMME, 'vide', nowMin);
		if (tl.driveMin !== null && tl.driveMin > nowMin) {
			const last = tl.points[tl.points.length - 1];
			expect(last.bac).toBeLessThan(tl.limit + 1e-6);
		}
	});

	it('adds +10 min margin only when still at or over limit at driveMin', () => {
		const nowMin = 18 * 60;
		const drinks = Array.from({ length: 6 }, (_, i) => ({
			id: String(i),
			type: 'shot' as const,
			volume: 30,
			degre: 40,
			heure: '17:00'
		}));
		const tl = buildProjectionTimeline(drinks, HOMME, 'vide', nowMin);
		if (tl.driveMin !== null && tl.driveMin > nowMin) {
			const nearDrive = tl.points.filter(
				(p) => Math.abs(p.tMin - tl.driveMin!) <= (tl.toMin - tl.fromMin) / 48
			);
			const atDrive = nearDrive.reduce(
				(best, p) => (Math.abs(p.tMin - tl.driveMin!) < Math.abs(best.tMin - tl.driveMin!) ? p : best),
				nearDrive[0]
			);
			if (atDrive && atDrive.bac >= tl.limit) {
				expect(tl.toMin).toBe(tl.driveMin! + 10);
			}
		}
	});

	it('sets driveMin null and extends chart to 24h when over limit for whole horizon', () => {
		const nowMin = 22 * 60;
		const drinks = Array.from({ length: 30 }, (_, i) => ({
			id: String(i),
			type: 'shot' as const,
			volume: 30,
			degre: 40,
			heure: '22:00'
		}));
		const tl = buildProjectionTimeline(drinks, HOMME, 'vide', nowMin);
		expect(tl.driveMin).toBeNull();
		expect(tl.toMin).toBe(nowMin + 24 * 60);
	});

	it('returns flat zero when no drinks', () => {
		const nowMin = 600;
		const tl = buildProjectionTimeline([], HOMME, 'vide', nowMin);
		expect(tl.fromMin).toBe(nowMin);
		expect(tl.peakBac).toBe(0);
		expect(tl.points.every((p) => p.bac === 0)).toBe(true);
	});
});
