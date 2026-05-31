# AlcoSense — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first static web app (AlcoSense) that tracks alcohol consumption, estimates current blood-alcohol content (BAC) with a proper Widmark rise+elimination model, and tells the user when they can drive again — deployed to GitHub Pages.

**Architecture:** 100% client-side SvelteKit app with `adapter-static` (no backend). All data lives in `localStorage`. A pure, fully-tested calculation module (`widmark.ts`) is decoupled from the UI; reactive state (Svelte 5 runes) lives in `stores.svelte.ts`; small single-responsibility components compose the single page. The page is client-rendered only (`ssr = false`) so `localStorage` works without hydration mismatch.

**Tech Stack:** Svelte 5 (runes), SvelteKit, Vite, TypeScript, `@sveltejs/adapter-static`, Tailwind CSS v4, Vitest, Material Symbols + Inter fonts, GitHub Actions → GitHub Pages.

**Source of truth:** `docs/superpowers/specs/2026-05-31-boire-et-conduire-design.md`. The visual reference is `/Maquette_Design` (`screen.png`, `code.html`, `DESIGN.md`). ⚠️ `code.html` JS is a naive prototype — the spec's calculation section wins (ethanol density 0.789, stomach-dependent rise phase, elimination, sampling).

**Design rules (recap):**
- Mobile First: single column, `max-w-md` (~448px) centered, 24px side margins. Works on desktop but mobile is primary.
- Minimalist Glassmorphism: glass cards (`backdrop-filter: blur`), large radii, pill buttons, strong type-weight contrast (BAC = Inter Thin 100).
- Palette "Studio White": emerald = safe, coral red = danger.
- Drinks: 5 types, quick-add presets, each added drink edits `volume` + `degre` + `heure` inline.
- 3 stomach states: vide (30 min rise) / grignoté (60 min) / repas (90 min).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `svelte.config.js` | adapter-static + base path for GitHub Pages |
| `vite.config.ts` | Tailwind v4 plugin + Vitest config |
| `src/app.html` | HTML shell; loads Inter + Material Symbols fonts |
| `src/app.css` | Tailwind import + `@theme` design tokens + `.glass-card` utility |
| `src/routes/+layout.ts` | `prerender = true`, `ssr = false` |
| `src/routes/+layout.svelte` | App shell: fixed header + footer, hydrates store |
| `src/routes/+page.svelte` | Page composition + live "now" tick + derived BAC |
| `src/lib/types.ts` | Types, presets, physiological constants, `legalLimit()` |
| `src/lib/widmark.ts` | Pure BAC math (alcohol grams, absorption, BAC at instant, drive time, curve sampling). No UI deps. |
| `src/lib/widmark.test.ts` | Unit tests for `widmark.ts` |
| `src/lib/storage.ts` | localStorage read/write (profile, drinks, stomach), SSR-guarded |
| `src/lib/stores.svelte.ts` | Reactive state (runes) + hydration + persistence |
| `src/lib/components/BacPanel.svelte` | BAC hero readout + safety status card |
| `src/lib/components/ProjectionChart.svelte` | SVG BAC-over-time projection + sobriety timer |
| `src/lib/components/QuickAdd.svelte` | Horizontal scroll of drink-type add buttons |
| `src/lib/components/DrinkList.svelte` | List of drinks (empty state + count + reset) |
| `src/lib/components/DrinkItem.svelte` | One drink row: inline edit volume/degré/heure + remove |
| `src/lib/components/ProfileForm.svelte` | Gender segmented, weight slider, stomach 3-state, young-driver toggle |
| `.github/workflows/deploy.yml` | Build + publish to GitHub Pages on push to `main` |

---

## Task 1: Scaffold project (SvelteKit + static adapter + Tailwind v4 + Vitest)

**Files:**
- Create: project skeleton via `npx sv create`
- Modify: `svelte.config.js`, `vite.config.ts`

The repo already contains `CLAUDE.md`, `docs/`, `Maquette_Design/`. Scaffold **in place** (current directory) so these are preserved.

- [ ] **Step 1: Scaffold SvelteKit into the current directory**

Run (from repo root `Boire&Conduire/`):
```bash
npx sv create . --template minimal --types ts --no-add-ons --install npm
```
If `sv` refuses a non-empty directory, scaffold in a temp dir and move files:
```bash
npx sv create /tmp/alcosense --template minimal --types ts --no-add-ons --install npm
rsync -a --exclude='.git' /tmp/alcosense/ ./
npm install
```
Expected: `package.json`, `svelte.config.js`, `vite.config.ts`, `src/`, `src/routes/+page.svelte` exist.

- [ ] **Step 1b: Verify/merge `.gitignore`**

The repo already had a minimal `.gitignore`. The scaffold may not have merged its entries. Ensure these are present (append any missing):
```
node_modules
/build
/.svelte-kit
/package
.env
.env.*
!.env.example
.DS_Store
```
Run to confirm the build dirs are ignored:
```bash
git check-ignore node_modules .svelte-kit build && echo "ignored OK"
```
Expected: prints `ignored OK`.

- [ ] **Step 2: Add the static adapter, Tailwind v4, and Vitest**

Run:
```bash
npm install -D @sveltejs/adapter-static @tailwindcss/vite tailwindcss vitest @vitest/ui jsdom
```
Expected: all packages installed, no peer-dependency errors.

- [ ] **Step 3: Configure `svelte.config.js` for static export + GitHub Pages base path**

Replace `svelte.config.js` with:
```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: process.env.BASE_PATH ?? ''
		}
	}
};

export default config;
```

- [ ] **Step 4: Configure `vite.config.ts` (Tailwind plugin + Vitest)**

Replace `vite.config.ts` with:
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
```

- [ ] **Step 5: Add the `test` script**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify the dev server boots**

Run:
```bash
npm run dev -- --port 5173 &
sleep 4 && curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ ; kill %1
```
Expected: prints `200`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold SvelteKit static app with Tailwind v4 and Vitest"
```

---

## Task 2: Design tokens & global styles

**Files:**
- Modify: `src/app.html`
- Create/Replace: `src/app.css`

- [ ] **Step 1: Load fonts in `src/app.html`**

Replace the contents of `src/app.html` with:
```html
<!doctype html>
<html lang="fr" class="light">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link
			href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;600;700;800&display=swap"
			rel="stylesheet"
		/>
		<link
			href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap"
			rel="stylesheet"
		/>
		<title>AlcoSense</title>
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover" class="bg-surface-bright text-on-surface">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

- [ ] **Step 2: Define design tokens + glass utility in `src/app.css`**

Replace `src/app.css` with (tokens taken from `Maquette_Design/DESIGN.md` frontmatter — only the subset the UI uses):
```css
@import 'tailwindcss';

@theme {
	--color-surface: #faf8ff;
	--color-surface-bright: #faf8ff;
	--color-surface-dim: #d2d9f4;
	--color-surface-container-lowest: #ffffff;
	--color-surface-container-low: #f2f3ff;
	--color-surface-container: #eaedff;
	--color-surface-container-high: #e2e7ff;
	--color-surface-container-highest: #dae2fd;
	--color-on-surface: #131b2e;
	--color-on-surface-variant: #3c4a42;
	--color-outline: #6c7a71;
	--color-outline-variant: #bbcabf;
	--color-primary: #006c49;
	--color-on-primary: #ffffff;
	--color-primary-container: #10b981;
	--color-on-primary-container: #00422b;
	--color-secondary: #b90538;
	--color-secondary-container: #dc2c4f;
	--color-on-secondary-container: #fffbff;
	--color-error: #ba1a1a;

	/* Warning (orange) — "near limit / absorbing" zone. Not in the maquette
	   tokens; a desaturated amber that fits the Studio White palette. */
	--color-warning: #8a5300;
	--color-warning-container: #f59e0b;

	--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

/* Material Symbols base */
.material-symbols-outlined {
	font-family: 'Material Symbols Outlined';
	font-weight: normal;
	font-style: normal;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	display: inline-block;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
}

/* Level-1 glass surface (DESIGN.md: blur 24px, translucent white, hairline border) */
.glass-card {
	backdrop-filter: blur(24px);
	background: rgba(255, 255, 255, 0.85);
	border: 1px solid rgba(0, 0, 0, 0.03);
}

/* Pulse dot for "live monitoring" indicator */
.pulse-dot {
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
	0%,
	100% {
		opacity: 1;
		transform: scale(1);
	}
	50% {
		opacity: 0.5;
		transform: scale(0.9);
	}
}

/* Hide horizontal scrollbar on the quick-add row */
.no-scrollbar::-webkit-scrollbar {
	display: none;
}
.no-scrollbar {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

body {
	font-family: var(--font-sans);
}
```

- [ ] **Step 3: Import `app.css` from the root layout**

If `src/routes/+layout.svelte` does not yet exist, create it (it will be expanded in Task 7):
```svelte
<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}
```

- [ ] **Step 4: Verify build of styles**

Run:
```bash
npm run dev -- --port 5173 &
sleep 4 && curl -s http://localhost:5173/ | grep -q "material-symbols\|app" && echo OK ; kill %1
```
Expected: prints `OK` (page renders without errors).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add design tokens, fonts and glass styles"
```

---

## Task 3: Types, presets and physiological constants

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write `src/lib/types.ts`**

```typescript
export type Sexe = 'homme' | 'femme';
export type StomachState = 'vide' | 'grignote' | 'repas';
export type DrinkType = 'biere' | 'vin' | 'shot' | 'cocktail' | 'spiritueux';

export interface Profile {
	poids: number; // kg
	sexe: Sexe;
	jeunePermis: boolean;
}

export interface Drink {
	id: string;
	type: DrinkType;
	volume: number; // ml
	degre: number; // % vol
	heure: string; // "HH:MM" 24h, time of day
}

export interface DrinkPreset {
	label: string;
	icon: string; // Material Symbols name
	volume: number; // ml
	degre: number; // % vol
}

/** Spec presets (editable after add). Volumes in ml. */
export const DRINK_PRESETS: Record<DrinkType, DrinkPreset> = {
	biere: { label: 'Bière', icon: 'sports_bar', volume: 250, degre: 5 },
	vin: { label: 'Vin', icon: 'wine_bar', volume: 125, degre: 12 },
	shot: { label: 'Shot', icon: 'liquor', volume: 30, degre: 40 },
	cocktail: { label: 'Cocktail', icon: 'local_bar', volume: 100, degre: 15 },
	spiritueux: { label: 'Spiritueux', icon: 'glass_full', volume: 40, degre: 40 }
};

/** Widmark distribution coefficient r. */
export const WIDMARK_R: Record<Sexe, number> = { homme: 0.7, femme: 0.6 };

/** Linear-rise duration (minutes) by stomach state. */
export const STOMACH_RISE_MIN: Record<StomachState, number> = {
	vide: 30,
	grignote: 60,
	repas: 90
};

export const STOMACH_LABELS: Record<StomachState, { title: string; desc: string }> = {
	vide: { title: 'À jeun', desc: 'Absorption maximale' },
	grignote: { title: 'A grignoté', desc: 'Absorption modérée' },
	repas: { title: 'Repas complet', desc: 'Absorption ralentie' }
};

/** Ethanol density (g/ml). */
export const ETHANOL_DENSITY = 0.789;

/** Elimination rate (g/L per hour). */
export const ELIMINATION_RATE = 0.15;

export const DEFAULT_PROFILE: Profile = {
	poids: 75,
	sexe: 'homme',
	jeunePermis: false
};

export const DEFAULT_STOMACH: StomachState = 'vide';

/** Legal BAC limit (g/L). */
export function legalLimit(jeunePermis: boolean): number {
	return jeunePermis ? 0.2 : 0.5;
}
```

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npm run check
```
Expected: no errors referencing `src/lib/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add domain types, drink presets and constants"
```

---

## Task 4: Pure Widmark calculation (TDD)

**Files:**
- Create: `src/lib/widmark.ts`
- Test: `src/lib/widmark.test.ts`

The module is pure (no UI, no Date side-effects in the core math — Date is only used in thin façade helpers). Core functions operate on minutes-of-day so tests are deterministic. The BAC is **forward-integrated** minute by minute and clamped at 0 at every step, so elimination never accumulates "credit" while the rate sits at 0 (a closed-form `max(0, Σc − β·t)` would under-estimate a drink taken after a sober gap — the dangerous direction for this app).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/widmark.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
	alcoholGrams,
	fractionAbsorbed,
	bacAtMinute,
	resolveDrinkMinute,
	driveTimeMinute,
	bacNow,
	sampleCurve
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
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run:
```bash
npm test
```
Expected: FAIL — `Failed to resolve import "./widmark"` / functions not defined.

- [ ] **Step 3: Implement `src/lib/widmark.ts`**

```typescript
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
 * The absolute minute (>= nowMin) AFTER WHICH the BAC stays under the legal
 * limit: the last minute in the next 24h where BAC > limit, plus 1. Returns
 * `nowMin` if BAC is already and durably below the limit. This is correct during
 * the rise phase — returning the *first* minute under the limit would wrongly
 * say "safe" just before the peak exceeds the limit.
 */
export function driveTimeMinute(
	drinks: Drink[],
	profile: Profile,
	stomach: StomachState,
	nowMin: number
): number {
	const items = toAbsorbed(drinks, nowMin);
	if (items.length === 0) return nowMin;
	const r = WIDMARK_R[profile.sexe];
	const rise = STOMACH_RISE_MIN[stomach];
	const limit = legalLimit(profile.jeunePermis);
	const { firstStart, bac } = trajectory(items, profile.poids, r, rise, nowMin + DAY);
	let lastOver = -1;
	for (let t = nowMin; t <= nowMin + DAY; t++) {
		if (bac[t - firstStart] > limit) lastOver = t;
	}
	return lastOver === -1 ? nowMin : Math.min(lastOver + 1, nowMin + DAY);
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
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run:
```bash
npm test
```
Expected: PASS — all `widmark.test.ts` cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/widmark.ts src/lib/widmark.test.ts
git commit -m "feat: pure Widmark BAC model with rise phase, drive-time and curve sampling"
```

---

## Task 5: localStorage persistence

**Files:**
- Create: `src/lib/storage.ts`

- [ ] **Step 1: Write `src/lib/storage.ts`**

```typescript
import { browser } from '$app/environment';
import {
	DEFAULT_PROFILE,
	DEFAULT_STOMACH,
	type Drink,
	type Profile,
	type StomachState
} from './types';

const KEY_PROFILE = 'alcosense:profile';
const KEY_DRINKS = 'alcosense:drinks';
const KEY_STOMACH = 'alcosense:stomach';

function read<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	const raw = localStorage.getItem(key);
	if (!raw) return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

function write(key: string, value: unknown): void {
	if (!browser) return;
	localStorage.setItem(key, JSON.stringify(value));
}

export function loadProfile(): Profile {
	return { ...DEFAULT_PROFILE, ...read<Partial<Profile>>(KEY_PROFILE, {}) };
}
export function saveProfile(profile: Profile): void {
	write(KEY_PROFILE, profile);
}

export function loadDrinks(): Drink[] {
	return read<Drink[]>(KEY_DRINKS, []);
}
export function saveDrinks(drinks: Drink[]): void {
	write(KEY_DRINKS, drinks);
}

export function loadStomach(): StomachState {
	return read<StomachState>(KEY_STOMACH, DEFAULT_STOMACH);
}
export function saveStomach(stomach: StomachState): void {
	write(KEY_STOMACH, stomach);
}
```

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npm run check
```
Expected: no errors referencing `src/lib/storage.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/storage.ts
git commit -m "feat: localStorage persistence for profile, drinks and stomach"
```

---

## Task 6: Reactive store (runes)

**Files:**
- Create: `src/lib/stores.svelte.ts`

State is hydrated from `localStorage` at module init (client only — the page is `ssr = false`, so no hydration mismatch). Persistence is wired with a plain `$effect` in `+layout.svelte` (Task 7), which runs in a component context — more idiomatic and robust than a module-scope `$effect.root`.

- [ ] **Step 1: Write `src/lib/stores.svelte.ts`**

```typescript
import { browser } from '$app/environment';
import {
	DEFAULT_PROFILE,
	DEFAULT_STOMACH,
	DRINK_PRESETS,
	type Drink,
	type DrinkType,
	type Profile,
	type StomachState
} from './types';
import * as storage from './storage';

export const profile = $state<Profile>({ ...DEFAULT_PROFILE });
export const drinks = $state<Drink[]>([]);
/** Wrapper object so `stomach` stays bindable across modules. */
export const session = $state<{ stomach: StomachState }>({ stomach: DEFAULT_STOMACH });

function nowHHMM(): string {
	const d = new Date();
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function addDrink(type: DrinkType): void {
	const preset = DRINK_PRESETS[type];
	drinks.push({
		id: crypto.randomUUID(),
		type,
		volume: preset.volume,
		degre: preset.degre,
		heure: nowHHMM()
	});
}

export function updateDrink(id: string, patch: Partial<Pick<Drink, 'volume' | 'degre' | 'heure'>>): void {
	const drink = drinks.find((d) => d.id === id);
	if (drink) Object.assign(drink, patch);
}

export function removeDrink(id: string): void {
	const i = drinks.findIndex((d) => d.id === id);
	if (i !== -1) drinks.splice(i, 1);
}

/** Clear drinks only; keep the profile. */
export function resetDrinks(): void {
	drinks.splice(0, drinks.length);
}

if (browser) {
	// Hydrate from storage on the client. Persistence is wired in +layout.svelte
	// (component context) to avoid a module-scope $effect.root.
	Object.assign(profile, storage.loadProfile());
	drinks.splice(0, drinks.length, ...storage.loadDrinks());
	session.stomach = storage.loadStomach();
}
```

- [ ] **Step 2: Verify it type-checks and the Svelte compiler accepts the runes module**

Run:
```bash
npm run check 2>&1 | tail -5
```
Expected: no errors referencing `stores.svelte.ts` (warnings unrelated to this file are acceptable for now).

- [ ] **Step 3: Commit**

```bash
git add src/lib/stores.svelte.ts
git commit -m "feat: reactive store with hydration and persistence"
```

---

## Task 7: App shell (layout: header + footer)

**Files:**
- Create: `src/routes/+layout.ts`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Configure rendering in `src/routes/+layout.ts`**

```typescript
export const prerender = true;
export const ssr = false;
```

- [ ] **Step 2: Write the shell in `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { profile, drinks, session } from '$lib/stores.svelte';
	import * as storage from '$lib/storage';

	let { children } = $props();

	// Persist state to localStorage whenever it changes (component context).
	$effect(() => {
		if (browser) storage.saveProfile($state.snapshot(profile));
	});
	$effect(() => {
		if (browser) storage.saveDrinks($state.snapshot(drinks));
	});
	$effect(() => {
		if (browser) storage.saveStomach(session.stomach);
	});
</script>

<header
	class="fixed top-0 right-0 left-0 z-50 border-b border-surface-container/50 bg-surface-bright/90 backdrop-blur-xl"
>
	<div class="mx-auto flex max-w-md items-center justify-between px-6 py-4">
		<span class="text-xl font-bold tracking-tighter text-primary">AlcoSense</span>
		<span class="pulse-dot h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span>
	</div>
</header>

<main class="min-h-screen pt-24 pb-32">
	<div class="mx-auto max-w-md space-y-5 px-6">
		{@render children()}
	</div>
</main>

<footer
	class="fixed right-0 bottom-0 left-0 border-t border-surface-container bg-surface-bright/80 p-4 backdrop-blur-md"
	style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
>
	<div
		class="mx-auto flex max-w-md items-center justify-between text-[11px] font-bold tracking-widest text-outline uppercase"
	>
		<span>© 2026 AlcoSense</span>
		<span>Estimation indicative</span>
	</div>
</footer>
```

- [ ] **Step 3: Verify the shell renders**

Run:
```bash
npm run dev -- --port 5173 &
sleep 4 && curl -s http://localhost:5173/ | grep -q "AlcoSense" && echo OK ; kill %1
```
Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.ts src/routes/+layout.svelte
git commit -m "feat: app shell with fixed glass header and footer"
```

---

## Task 8: BAC panel (hero + safety status)

**Files:**
- Create: `src/lib/components/BacPanel.svelte`

- [ ] **Step 1: Write `src/lib/components/BacPanel.svelte`**

Props: `bac` (g/L), `limit` (g/L), `driveMin` (absolute minute one can drive — from `driveTimeMinute`), `nowMin` (current minute-of-day). Derives a 3-zone status and the main "drive time" message. All status class strings are literals so Tailwind v4 detects them.
```svelte
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
```

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npm run check 2>&1 | grep -i "BacPanel" || echo "no BacPanel errors"
```
Expected: prints `no BacPanel errors`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/BacPanel.svelte
git commit -m "feat: BAC hero readout and safety status card"
```

---

## Task 9: Projection chart

**Files:**
- Create: `src/lib/components/ProjectionChart.svelte`

Renders the BAC curve from now until the drive time (or +30 min margin) as an SVG path, plus the dashed legal-limit line and the sobriety timer.

- [ ] **Step 1: Write `src/lib/components/ProjectionChart.svelte`**

```svelte
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
```

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npm run check 2>&1 | grep -i "ProjectionChart" || echo "no ProjectionChart errors"
```
Expected: prints `no ProjectionChart errors`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ProjectionChart.svelte
git commit -m "feat: BAC projection chart with limit line and sobriety timer"
```

---

## Task 10: Quick-add drink buttons

**Files:**
- Create: `src/lib/components/QuickAdd.svelte`

- [ ] **Step 1: Write `src/lib/components/QuickAdd.svelte`**

Iterates over all 5 presets; calls `addDrink` from the store.
```svelte
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
```

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npm run check 2>&1 | grep -i "QuickAdd" || echo "no QuickAdd errors"
```
Expected: prints `no QuickAdd errors`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/QuickAdd.svelte
git commit -m "feat: quick-add drink buttons for all 5 presets"
```

---

## Task 11: Drink list + editable drink item

**Files:**
- Create: `src/lib/components/DrinkItem.svelte`
- Create: `src/lib/components/DrinkList.svelte`

- [ ] **Step 1: Write `src/lib/components/DrinkItem.svelte`**

One row. Inline-editable `volume`, `degre`, `heure` (spec requirement). Bindings call `updateDrink`; the close button calls `removeDrink`.
```svelte
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
```

- [ ] **Step 2: Write `src/lib/components/DrinkList.svelte`**

Header (title + count + reset) and the list/empty state.
```svelte
<script lang="ts">
	import { drinks, resetDrinks } from '$lib/stores.svelte';
	import DrinkItem from './DrinkItem.svelte';
</script>

<section class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-on-surface">Consommations</h2>
		<div class="flex items-center gap-3">
			<span class="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-primary"
				>{drinks.length}</span
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
```

- [ ] **Step 3: Verify it type-checks**

Run:
```bash
npm run check 2>&1 | grep -iE "DrinkItem|DrinkList" || echo "no DrinkList errors"
```
Expected: prints `no DrinkList errors`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/DrinkItem.svelte src/lib/components/DrinkList.svelte
git commit -m "feat: drink list with inline-editable volume/degré/heure and remove"
```

---

## Task 12: Profile form

**Files:**
- Create: `src/lib/components/ProfileForm.svelte`

Gender segmented control, weight slider, 3-state stomach selector, young-driver toggle. Binds directly to the `profile` and `session` store state.

- [ ] **Step 1: Write `src/lib/components/ProfileForm.svelte`**

```svelte
<script lang="ts">
	import { profile, session } from '$lib/stores.svelte';
	import { STOMACH_LABELS, type Sexe, type StomachState } from '$lib/types';

	const stomachStates = Object.keys(STOMACH_LABELS) as StomachState[];

	function genderClass(sexe: Sexe): string {
		return profile.sexe === sexe
			? 'flex-1 rounded-full py-2.5 text-[13px] font-bold bg-primary text-white shadow-md transition-all'
			: 'flex-1 rounded-full py-2.5 text-[13px] font-bold text-outline-variant transition-all hover:text-on-surface';
	}
</script>

<section class="glass-card space-y-6 rounded-3xl p-6">
	<h3 class="text-[13px] font-bold tracking-wider text-outline uppercase">Configuration profil</h3>

	<!-- Genre -->
	<div>
		<label class="mb-3 block text-[11px] font-bold text-outline uppercase">Genre</label>
		<div class="flex rounded-full border border-surface-container bg-white p-1">
			<button type="button" class={genderClass('homme')} onclick={() => (profile.sexe = 'homme')}>
				Homme
			</button>
			<button type="button" class={genderClass('femme')} onclick={() => (profile.sexe = 'femme')}>
				Femme
			</button>
		</div>
	</div>

	<!-- Poids -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<label for="weight" class="text-[11px] font-bold text-outline uppercase">Poids corporel</label>
			<span class="rounded-full bg-primary-container/10 px-3 py-1 text-sm font-bold text-primary"
				>{profile.poids} kg</span
			>
		</div>
		<input
			id="weight"
			type="range"
			min="40"
			max="150"
			bind:value={profile.poids}
			class="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-container accent-primary"
		/>
	</div>

	<!-- État estomac -->
	<div>
		<label class="mb-3 block text-[11px] font-bold text-outline uppercase">État de l'estomac</label>
		<div class="grid grid-cols-1 gap-2">
			{#each stomachStates as state (state)}
				<button
					type="button"
					onclick={() => (session.stomach = state)}
					class="rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:border-primary/50 {session.stomach ===
					state
						? 'border-primary/50 ring-2 ring-primary/20'
						: 'border-white'}"
				>
					<span class="mb-1 block text-sm leading-none font-bold">{STOMACH_LABELS[state].title}</span>
					<span class="text-[11px] text-outline">{STOMACH_LABELS[state].desc}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Jeune conducteur -->
	<div class="flex items-center justify-between rounded-2xl border border-surface-container bg-white p-4">
		<div class="flex flex-col">
			<span class="text-sm font-bold text-on-surface">Jeune conducteur</span>
			<span class="text-[11px] text-outline">Limite réduite à 0,2 g/L</span>
		</div>
		<label class="relative inline-flex cursor-pointer items-center">
			<input type="checkbox" bind:checked={profile.jeunePermis} class="peer sr-only" />
			<div
				class="peer h-6 w-11 rounded-full bg-surface-container after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"
			></div>
		</label>
	</div>
</section>
```

- [ ] **Step 2: Verify it type-checks**

Run:
```bash
npm run check 2>&1 | grep -i "ProfileForm" || echo "no ProfileForm errors"
```
Expected: prints `no ProfileForm errors`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ProfileForm.svelte
git commit -m "feat: profile form (gender, weight, stomach, young driver)"
```

---

## Task 13: Page composition + live tick

**Files:**
- Modify: `src/routes/+page.svelte`

Wires everything: a `now` clock ticking each minute, derived BAC / drive time, and the component layout in the maquette's order (BAC → chart → consommations → profil).

- [ ] **Step 1: Replace `src/routes/+page.svelte`**

```svelte
<script lang="ts">
	import { profile, drinks, session } from '$lib/stores.svelte';
	import { bacNow, driveTimeMinute } from '$lib/widmark';
	import { legalLimit } from '$lib/types';
	import BacPanel from '$lib/components/BacPanel.svelte';
	import ProjectionChart from '$lib/components/ProjectionChart.svelte';
	import QuickAdd from '$lib/components/QuickAdd.svelte';
	import DrinkList from '$lib/components/DrinkList.svelte';
	import ProfileForm from '$lib/components/ProfileForm.svelte';

	// Live clock: re-evaluate every minute so the estimate stays current.
	let now = $state(new Date());
	$effect(() => {
		const id = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(id);
	});

	const nowMin = $derived(now.getHours() * 60 + now.getMinutes());
	const limit = $derived(legalLimit(profile.jeunePermis));
	const bac = $derived(bacNow(drinks, profile, session.stomach, now));
	const driveMin = $derived(driveTimeMinute(drinks, profile, session.stomach, nowMin));
</script>

<BacPanel {bac} {limit} {driveMin} {nowMin} />
<ProjectionChart {drinks} {profile} stomach={session.stomach} {limit} {nowMin} {driveMin} />

<section class="space-y-4">
	<QuickAdd />
	<DrinkList />
</section>

<ProfileForm />
```

- [ ] **Step 2: Verify the full app renders and reacts**

Run:
```bash
npm run dev -- --port 5173 &
sleep 4 && curl -s http://localhost:5173/ | grep -q "AlcoSense" && echo OK ; kill %1
```
Expected: prints `OK`. Then manually open `http://localhost:5173/`, add a beer, confirm the BAC readout, chart, and timer update; reload the page and confirm the drink and profile persisted.

- [ ] **Step 3: Run the test suite and type-check**

Run:
```bash
npm test && npm run check
```
Expected: tests PASS; svelte-check reports 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: compose page with live BAC tick and reactive drive time"
```

---

## Task 14: GitHub Pages deployment

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `static/.nojekyll`

`svelte.config.js` already reads `BASE_PATH` (Task 1). All internal asset URLs must use SvelteKit's `base` — this app has no internal links/asset paths beyond what SvelteKit injects, so no code change is needed, but the workflow sets `BASE_PATH` to the repo name.

- [ ] **Step 1: Add `static/.nojekyll`**

Create an empty file so GitHub Pages serves SvelteKit's `_app` directory:
```bash
mkdir -p static && touch static/.nojekyll
```

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: 'main'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Test
        run: npm test

      - name: Build
        env:
          BASE_PATH: '/${{ github.event.repository.name }}'
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'build/'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify a production build succeeds locally with the base path**

Run:
```bash
BASE_PATH='/Boire-Conduire' npm run build && ls build/index.html build/404.html
```
Expected: build completes; `build/index.html` and `build/404.html` exist.

- [ ] **Step 4: Verify the built site previews**

Run:
```bash
npm run preview -- --port 4173 &
sleep 4 && curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/ ; kill %1
```
Expected: prints `200`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml static/.nojekyll
git commit -m "ci: build, test and deploy to GitHub Pages on push to main"
```

> **Manual step (one-time, by Mathis):** In the GitHub repo → Settings → Pages → "Build and deployment" → Source = **GitHub Actions**. The repo name determines the base path; if the GitHub repo is not named `Boire-Conduire`, the `BASE_PATH` resolves automatically from `github.event.repository.name`, so no edit is needed.

---

## Task 15: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full local gate**

Run:
```bash
npm test && npm run check && BASE_PATH='/Boire-Conduire' npm run build
```
Expected: tests PASS, 0 svelte-check errors, build succeeds.

- [ ] **Step 2: Manual smoke test (mobile viewport)**

Open `npm run dev`, set the browser to a mobile viewport (~390px). Verify against `Maquette_Design/screen.png`:
- BAC hero is large, thin, centered; turns red when over the limit.
- Status card flips between "Apte à la conduite" / "Conduite interdite".
- Projection chart draws a descending curve with the dashed limit line; timer counts down.
- Quick-add adds drinks; each row edits volume/degré/heure inline; remove and reset work.
- Profile: gender toggle, weight slider, 3 stomach states, young-driver switch all update the BAC.
- Reload preserves drinks + profile (localStorage).

- [ ] **Step 3: Commit any final fixes, then merge to main**

If smoke test reveals visual gaps, fix them with surgical edits, then:
```bash
git add -A && git commit -m "fix: smoke-test adjustments"
```

---

## Self-Review (spec coverage)

- **Profil (poids, sexe→r, jeunePermis→seuil):** Task 3 (`WIDMARK_R`, `legalLimit`), Task 12 (form). ✅
- **État estomac (3 states → rise 30/60/90):** Task 3 (`STOMACH_RISE_MIN`), Task 4 (rise phase), Task 12. ✅
- **Consommations (5 types, presets, volume/degré/heure editable, remove):** Task 3 (presets), Task 10 (quick-add), Task 11 (inline edit + remove). ✅
- **Widmark (density 0.789, alcohol grams, linear rise, elimination β=0.15, forward-integrated with clamp-at-0 so no elimination "banking" across sober gaps, sampling, drive time = last minute over limit +1):** Task 4 with tests (incl. the sober-gap safety case). ✅
- **Absolute time / midnight crossing (`resolveDrinkMinute`):** Task 4, tested (drink 23:30 / now 00:30). ✅
- **Output — 3 colour zones (vert / orange = near-or-absorbing / rouge) + main message "Tu peux conduire à HH:MM" / "Tu peux conduire" + projection chart + sobriety timer + drink list + reset:** Task 8 (BAC + status + drive message), Task 9 (chart + timer), Task 11 (list + reset). ✅
- **Safe-during-rise UX risk:** handled — `driveMin > now` (BAC under limit but peak will exceed) renders the orange "Absorption en cours" state, not a false "Apte". Task 4 (drive-time) + Task 8. ✅
- **Extended widmark tests (women r=0.6, young-driver 0.2, stomach 60/90, future drink → 0, sampleCurve bounds):** Task 4. ✅
- **localStorage persistence (no backend):** Task 5 + Task 6. ✅
- **Static deploy to GitHub Pages via Actions:** Task 1 (adapter), Task 14 (workflow). ✅
- **Mobile First + glassmorphism design:** Task 2 (tokens/glass), Tasks 7–12 (mobile-first Tailwind, `max-w-md`). ✅
- **Tests on widmark.ts (1 beer fasting, empty → 0, back under limit):** Task 4. ✅

No placeholders, no `TBD`. Type names (`Drink`, `Profile`, `StomachState`, `DrinkType`) and function signatures (`bacNow`, `driveTimeMinute`, `sampleCurve`, `addDrink`, `updateDrink`, `removeDrink`, `resetDrinks`, `legalLimit`) are consistent across tasks.
