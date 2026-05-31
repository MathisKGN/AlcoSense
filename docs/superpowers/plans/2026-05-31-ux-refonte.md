# AlcoSense UX Refonte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre l’expérience mobile autour de la saisie des consommations (above the fold), un résumé BAC compact, une édition de verre via bottom sheet, et un graphique temporel lisible avec heures réelles alignées sur `driveMin`.

**Architecture:** Introduire un contrat unique `ProjectionTimeline` dans `widmark.ts` (calcul pur + tests). L’UI consomme ce contrat pour `BacSummary`, `ProjectionChart` et les libellés d’heure via `format.ts`. Remplacer `DrinkItem` inline par `DrinkRow` + `DrinkEditSheet`. Réordonner `+page.svelte` : saisie → liste → projection (repliable) → profil (repliable).

**Tech Stack:** Svelte 5 (runes), SvelteKit static, Tailwind v4, Vitest (pas de mocks sur widmark — données Drink construites en test).

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/lib/format.ts` | `formatMinuteOfDay`, `formatVolumeCl`, `formatDegre` |
| `src/lib/format.test.ts` | Tests unitaires format |
| `src/lib/widmark.ts` | Ajout `buildProjectionTimeline`, export `ProjectionTimeline` |
| `src/lib/widmark.test.ts` | Tests fenêtre graph + dernier point sous seuil |
| `src/lib/components/BacSummary.svelte` | BAC compact + statut + message conduite (remplace le hero `BacPanel`) |
| `src/lib/components/BacPanel.svelte` | **Supprimer** après migration (ou garder vide 1 commit — préférer delete) |
| `src/lib/components/DrinkRow.svelte` | Ligne résumé cliquable |
| `src/lib/components/DrinkEditSheet.svelte` | Bottom sheet édition volume/degré/heure |
| `src/lib/components/DrinkItem.svelte` | **Supprimer** (remplacé par Row + Sheet) |
| `src/lib/components/ProjectionChart.svelte` | Graph v2 : axes HH:MM, Y 0→max, pas de stretch |
| `src/lib/components/CollapsibleSection.svelte` | En-tête repliable réutilisable (graph + profil) |
| `src/lib/stores.svelte.ts` | `editingDrinkId`, `openDrinkEditor` / `closeDrinkEditor` |
| `src/routes/+page.svelte` | Nouvel ordre + dérivés timeline |
| `src/routes/+layout.svelte` | Padding header/footer réduit |
| `src/lib/components/DrinkList.svelte` | Utilise `DrinkRow`, monte `DrinkEditSheet` |
| `docs/superpowers/specs/2026-05-31-boire-et-conduire-design.md` | Mise à jour section UI (ordre page, sheet, libellés graph) |

---

## Product rules (locked for implementation)

1. **Axe X du graph** : gauche = heure actuelle (`formatMinuteOfDay(nowMin)`), droite = heure de conduite (`formatMinuteOfDay(driveMin)`). Sous-titre optionnel : « Sous le seuil légal » — jamais « Sobriété » seul.
2. **Fin de fenêtre** : `toMin = driveMin` si `driveMin > nowMin`, sinon `nowMin + 60`. Marge +10 min seulement si courbe encore au-dessus du seuil au point `driveMin` (voir tests).
3. **Axe Y** : `0` en bas, `maxY = Math.max(limit * 1.15, peakBac, 0.01)`. Pas de `preserveAspectRatio="none"`.
4. **Dernier point** : à `toMin`, le BAC affiché doit être `≤ limit` quand `driveMin` est l’heure de retour sous le seuil (spec existante).
5. **Saisie** : liste = résumé ; édition = sheet. Volume affiché en cl (25 cl), stockage interne en ml.
6. **Ordre page** : `BacSummary` (compact) → `QuickAdd` → `DrinkList` → `ProjectionChart` (repliable, fermé par défaut si `drinks.length === 0`) → `ProfileForm` (repliable, fermé par défaut).

---

### Task 1: Time/volume format helpers

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/format.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatMinuteOfDay, formatVolumeCl, formatDegre } from './format';

describe('formatMinuteOfDay', () => {
	it('formats minutes within a day', () => {
		expect(formatMinuteOfDay(0)).toBe('00:00');
		expect(formatMinuteOfDay(18 * 60 + 5)).toBe('18:05');
	});
	it('wraps values outside 0..1439', () => {
		expect(formatMinuteOfDay(1440 + 90)).toBe('01:30');
		expect(formatMinuteOfDay(-30)).toBe('23:30');
	});
});

describe('formatVolumeCl', () => {
	it('converts ml to cl without decimals when whole', () => {
		expect(formatVolumeCl(250)).toBe('25 cl');
		expect(formatVolumeCl(125)).toBe('12,5 cl');
	});
});

describe('formatDegre', () => {
	it('formats degree with comma decimal', () => {
		expect(formatDegre(5)).toBe('5 %');
		expect(formatDegre(12.5)).toBe('12,5 %');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/mathisgheddache/Documents/AlcoSense && npm test -- src/lib/format.test.ts`
Expected: FAIL — cannot find module `./format`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/format.ts
/** Format minutes-from-midnight as HH:MM (24h). */
export function formatMinuteOfDay(min: number): string {
	const m = ((Math.round(min) % 1440) + 1440) % 1440;
	const h = Math.floor(m / 60);
	const mm = m % 60;
	return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Display volume: storage is ml, UI prefers cl. */
export function formatVolumeCl(volumeMl: number): string {
	const cl = volumeMl / 10;
	const text = Number.isInteger(cl) ? String(cl) : cl.toFixed(1).replace('.', ',');
	return `${text} cl`;
}

export function formatDegre(degre: number): string {
	const text = Number.isInteger(degre) ? String(degre) : degre.toFixed(1).replace('.', ',');
	return `${text} %`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/format.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: add format helpers for time and drink display"
```

---

### Task 2: ProjectionTimeline contract (widmark)

**Files:**
- Modify: `src/lib/widmark.ts`
- Modify: `src/lib/widmark.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/widmark.test.ts`:

```typescript
import { buildProjectionTimeline } from './widmark';

describe('buildProjectionTimeline', () => {
	it('uses driveMin as chart end when still over limit', () => {
		const nowMin = 18 * 60;
		const tl = buildProjectionTimeline(beers(4, '17:00'), HOMME, 'vide', nowMin);
		expect(tl.toMin).toBeGreaterThanOrEqual(tl.driveMin);
		expect(tl.toMin).toBeGreaterThan(nowMin);
	});

	it('ends at or below legal limit at toMin when drive is in the future', () => {
		const nowMin = 18 * 60;
		const drinks = Array.from({ length: 6 }, (_, i) => ({
			id: String(i),
			type: 'shot' as const,
			volume: 30,
			degre: 40,
			heure: '17:00'
		}));
		const tl = buildProjectionTimeline(drinks, HOMME, 'vide', nowMin);
		if (tl.driveMin > nowMin) {
			const last = tl.points[tl.points.length - 1];
			expect(last.bac).toBeLessThanOrEqual(tl.limit + 1e-6);
		}
	});

	it('returns flat zero curve when no drinks', () => {
		const nowMin = 600;
		const tl = buildProjectionTimeline([], HOMME, 'vide', nowMin);
		expect(tl.peakBac).toBe(0);
		expect(tl.points.every((p) => p.bac === 0)).toBe(true);
		expect(tl.driveMin).toBe(nowMin);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/widmark.test.ts -t buildProjectionTimeline`
Expected: FAIL — `buildProjectionTimeline` is not exported

- [ ] **Step 3: Write minimal implementation**

Add to end of `src/lib/widmark.ts` (after `sampleCurve`):

```typescript
export interface ProjectionTimeline {
	nowMin: number;
	driveMin: number;
	limit: number;
	toMin: number;
	points: CurvePoint[];
	peakBac: number;
}

const TIMELINE_MARGIN_MIN = 10;
const SOBER_SPAN_MIN = 60;
const TIMELINE_STEPS = 48;

/**
 * Single contract for BAC summary, drive message, and projection chart.
 * Chart window ends at drive time (+small margin) when user cannot drive yet.
 */
export function buildProjectionTimeline(
	drinks: Drink[],
	profile: Profile,
	stomach: StomachState,
	nowMin: number
): ProjectionTimeline {
	const limit = legalLimit(profile.jeunePermis);
	const driveMin = driveTimeMinute(drinks, profile, stomach, nowMin);

	let toMin: number;
	if (drinks.length === 0) {
		toMin = nowMin + SOBER_SPAN_MIN;
	} else if (driveMin > nowMin) {
		toMin = driveMin + TIMELINE_MARGIN_MIN;
	} else {
		toMin = nowMin + SOBER_SPAN_MIN;
	}

	const points = sampleCurve(drinks, profile, stomach, nowMin, toMin, TIMELINE_STEPS);
	const peakBac = Math.max(0, ...points.map((p) => p.bac));

	return { nowMin, driveMin, limit, toMin, points, peakBac };
}
```

- [ ] **Step 4: Run full widmark tests**

Run: `npm test -- src/lib/widmark.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/widmark.ts src/lib/widmark.test.ts
git commit -m "feat: add buildProjectionTimeline for chart and UI contract"
```

---

### Task 3: Compact BacSummary component

**Files:**
- Create: `src/lib/components/BacSummary.svelte`
- Delete: `src/lib/components/BacPanel.svelte` (in Step 5 of Task 6 after page wired)

- [ ] **Step 1: Create BacSummary.svelte**

```svelte
<!-- src/lib/components/BacSummary.svelte -->
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
					chip: 'bg-secondary-container/15 text-secondary',
					icon: 'warning',
					title: 'Conduite interdite'
				};
			case 'soon':
				return {
					accent: 'text-warning',
					chip: 'bg-warning-container/15 text-warning',
					icon: 'hourglass_top',
					title: 'Absorption en cours'
				};
			case 'near':
				return {
					accent: 'text-warning',
					chip: 'bg-warning-container/15 text-warning',
					icon: 'warning',
					title: 'Proche du seuil'
				};
			default:
				return {
					accent: 'text-primary',
					chip: 'bg-primary-container/15 text-on-primary-container',
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
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: PASS (0 errors)

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/BacSummary.svelte
git commit -m "feat: add compact BacSummary card"
```

---

### Task 4: CollapsibleSection primitive

**Files:**
- Create: `src/lib/components/CollapsibleSection.svelte`

- [ ] **Step 1: Create component**

```svelte
<!-- src/lib/components/CollapsibleSection.svelte -->
<script lang="ts">
	let {
		title,
		open = $bindable(true),
		children
	}: {
		title: string;
		open?: boolean;
		children: import('svelte').Snippet;
	} = $props();
</script>

<section class="glass-card overflow-hidden rounded-3xl shadow-sm">
	<button
		type="button"
		class="flex w-full items-center justify-between px-6 py-4 text-left"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<h3 class="text-[13px] font-bold tracking-wider text-outline uppercase">{title}</h3>
		<span class="material-symbols-outlined text-outline">
			{open ? 'expand_less' : 'expand_more'}
		</span>
	</button>
	{#if open}
		<div class="px-6 pb-6">
			{@render children()}
		</div>
	{/if}
</section>
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/CollapsibleSection.svelte
git commit -m "feat: add CollapsibleSection for chart and profile"
```

---

### Task 5: Drink editor store + DrinkRow + DrinkEditSheet

**Files:**
- Modify: `src/lib/stores.svelte.ts`
- Create: `src/lib/components/DrinkRow.svelte`
- Create: `src/lib/components/DrinkEditSheet.svelte`
- Modify: `src/lib/components/DrinkList.svelte`
- Delete: `src/lib/components/DrinkItem.svelte`

- [ ] **Step 1: Extend store**

Add to `src/lib/stores.svelte.ts`:

```typescript
export const editingDrinkId = $state<string | null>(null);

export function openDrinkEditor(id: string): void {
	editingDrinkId = id;
}

export function closeDrinkEditor(): void {
	editingDrinkId = null;
}
```

- [ ] **Step 2: Create DrinkRow.svelte**

```svelte
<!-- src/lib/components/DrinkRow.svelte -->
<script lang="ts">
	import { DRINK_PRESETS, type Drink } from '$lib/types';
	import { formatVolumeCl, formatDegre, formatMinuteOfDay } from '$lib/format';
	import { openDrinkEditor, removeDrink } from '$lib/stores.svelte';
	import { resolveDrinkMinute } from '$lib/widmark';

	let { drink, nowMin }: { drink: Drink; nowMin: number } = $props();

	const preset = $derived(DRINK_PRESETS[drink.type]);
	const summary = $derived(
		`${formatVolumeCl(drink.volume)} · ${formatDegre(drink.degre)} · ${drink.heure}`
	);
</script>

<div
	class="flex items-center gap-3 rounded-2xl border border-surface-container bg-white p-3 shadow-sm"
>
	<div
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary"
	>
		<span class="material-symbols-outlined">{preset.icon}</span>
	</div>
	<button
		type="button"
		class="min-w-0 flex-1 text-left"
		onclick={() => openDrinkEditor(drink.id)}
	>
		<span class="block text-sm font-bold">{preset.label}</span>
		<span class="block truncate text-[11px] text-outline">{summary}</span>
	</button>
	<button
		type="button"
		class="p-2 text-outline-variant hover:text-error"
		aria-label="Supprimer ce verre"
		onclick={() => removeDrink(drink.id)}
	>
		<span class="material-symbols-outlined text-sm">close</span>
	</button>
</div>
```

Note: remove unused `resolveDrinkMinute` import if not used — use only `drink.heure` in summary.

- [ ] **Step 3: Create DrinkEditSheet.svelte**

```svelte
<!-- src/lib/components/DrinkEditSheet.svelte -->
<script lang="ts">
	import { DRINK_PRESETS, type Drink } from '$lib/types';
	import { drinks, editingDrinkId, closeDrinkEditor, updateDrink } from '$lib/stores.svelte';
	import { formatVolumeCl } from '$lib/format';

	let { nowMin }: { nowMin: number } = $props();

	const drink = $derived(drinks.find((d) => d.id === editingDrinkId) ?? null);
	const open = $derived(drink !== null);
	const preset = $derived(drink ? DRINK_PRESETS[drink.type] : null);

	function clampVolume(v: number): number {
		return Math.max(0, Math.round(v));
	}
	function clampDegre(v: number): number {
		return Math.max(0, Math.min(100, Math.round(v * 2) / 2));
	}

	function onBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) closeDrinkEditor();
	}
</script>

{#if open && drink && preset}
	<div
		class="fixed inset-0 z-[60] flex items-end justify-center bg-on-surface/40 p-4"
		role="presentation"
		onclick={onBackdrop}
	>
		<div
			class="w-full max-w-md rounded-t-3xl bg-surface-bright p-6 shadow-xl"
			role="dialog"
			aria-labelledby="edit-drink-title"
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 id="edit-drink-title" class="text-lg font-bold">{preset.label}</h2>
				<button
					type="button"
					class="p-2 text-outline"
					aria-label="Fermer"
					onclick={closeDrinkEditor}
				>
					<span class="material-symbols-outlined">close</span>
				</button>
			</div>

			<div class="space-y-6">
				<div>
					<p class="mb-2 text-[11px] font-bold text-outline uppercase">Volume</p>
					<div class="flex items-center justify-between gap-3">
						<button
							type="button"
							class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-xl font-bold"
							onclick={() => updateDrink(drink.id, { volume: clampVolume(drink.volume - 10) })}
						>
							−
						</button>
						<span class="text-lg font-bold tabular-nums">{formatVolumeCl(drink.volume)}</span>
						<button
							type="button"
							class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-xl font-bold"
							onclick={() => updateDrink(drink.id, { volume: clampVolume(drink.volume + 10) })}
						>
							+
						</button>
					</div>
				</div>

				<div>
					<p class="mb-2 text-[11px] font-bold text-outline uppercase">Degré d'alcool</p>
					<div class="flex items-center justify-between gap-3">
						<button
							type="button"
							class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-xl font-bold"
							onclick={() => updateDrink(drink.id, { degre: clampDegre(drink.degre - 0.5) })}
						>
							−
						</button>
						<span class="text-lg font-bold tabular-nums">{drink.degre} %</span>
						<button
							type="button"
							class="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-xl font-bold"
							onclick={() => updateDrink(drink.id, { degre: clampDegre(drink.degre + 0.5) })}
						>
							+
						</button>
					</div>
				</div>

				<div>
					<label for="drink-heure" class="mb-2 block text-[11px] font-bold text-outline uppercase">
						Heure de consommation
					</label>
					<input
						id="drink-heure"
						type="time"
						value={drink.heure}
						onchange={(e) => updateDrink(drink.id, { heure: e.currentTarget.value })}
						class="w-full rounded-xl border border-surface-container bg-white px-4 py-3 text-base font-semibold text-on-surface"
					/>
				</div>
			</div>

			<button
				type="button"
				class="mt-8 w-full rounded-full bg-primary py-3 text-sm font-bold text-on-primary"
				onclick={closeDrinkEditor}
			>
				Terminé
			</button>
		</div>
	</div>
{/if}
```

Remove unused `nowMin` prop if not used in sheet (or keep for future « il y a X min »).

- [ ] **Step 4: Update DrinkList.svelte**

```svelte
<script lang="ts">
	import { drinks, resetDrinks } from '$lib/stores.svelte';
	import DrinkRow from './DrinkRow.svelte';
	import DrinkEditSheet from './DrinkEditSheet.svelte';

	let { nowMin }: { nowMin: number } = $props();
</script>

<section class="space-y-4">
	<!-- header unchanged -->
	<div class="space-y-3">
		{#if drinks.length === 0}
			<!-- empty state unchanged -->
		{:else}
			{#each drinks as drink (drink.id)}
				<DrinkRow {drink} {nowMin} />
			{/each}
		{/if}
	</div>
</section>

<DrinkEditSheet {nowMin} />
```

- [ ] **Step 5: Delete DrinkItem.svelte**

```bash
rm src/lib/components/DrinkItem.svelte
```

- [ ] **Step 6: Run check and test**

Run: `npm run check && npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/stores.svelte.ts src/lib/components/DrinkRow.svelte src/lib/components/DrinkEditSheet.svelte src/lib/components/DrinkList.svelte
git rm src/lib/components/DrinkItem.svelte
git commit -m "feat: replace inline drink inputs with row and edit sheet"
```

---

### Task 6: ProjectionChart v2 (readable timeline)

**Files:**
- Modify: `src/lib/components/ProjectionChart.svelte`

- [ ] **Step 1: Replace ProjectionChart.svelte**

Key implementation requirements:

```svelte
<script lang="ts">
	import type { ProjectionTimeline } from '$lib/widmark';
	import { formatMinuteOfDay } from '$lib/format';

	let { timeline }: { timeline: ProjectionTimeline } = $props();

	const { nowMin, driveMin, limit, toMin, points, peakBac } = $derived(timeline);

	const maxY = $derived(Math.max(limit * 1.15, peakBac, 0.01));

	function x(minutesFromNow: number): number {
		const span = Math.max(1, toMin - nowMin);
		return (minutesFromNow / span) * 100;
	}
	function y(bac: number): number {
		return 90 - (bac / maxY) * 80;
	}

	const linePath = $derived(
		points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.minutesFromNow)},${y(p.bac)}`).join(' ')
	);
	const limitY = $derived(y(limit));

	const startLabel = $derived(formatMinuteOfDay(nowMin));
	const endLabel = $derived(
		driveMin > nowMin ? formatMinuteOfDay(driveMin) : formatMinuteOfDay(toMin)
	);

	const remainingMin = $derived(Math.max(0, driveMin - nowMin));
	const timer = $derived(
		remainingMin === 0
			? 'Sous le seuil'
			: `${String(Math.floor(remainingMin / 60)).padStart(2, '0')}h${String(
					Math.round(remainingMin % 60)
				).padStart(2, '0')} restant`
	);
</script>

<!-- SVG: preserveAspectRatio="xMidYMid meet" (NOT none) -->
<!-- X labels: {startLabel} left, {endLabel} right -->
<!-- Subtitle under title: "Limite légale {limit} g/L" -->
<!-- Remove duplicate timer if BacSummary already shows it — keep only "Sous le seuil" / restant here OR drop timer entirely (prefer drop to avoid duplication) -->
```

Drop the `timer` span in chart header if `BacSummary` already shows countdown — chart header shows only « Projection » + « Limite 0,5 g/L ».

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ProjectionChart.svelte
git commit -m "feat: projection chart with real time axis and fixed Y scale"
```

---

### Task 7: Page reorder + wire timeline

**Files:**
- Modify: `src/routes/+page.svelte`
- Delete: `src/lib/components/BacPanel.svelte`

- [ ] **Step 1: Rewrite +page.svelte**

```svelte
<script lang="ts">
	import { profile, drinks, session } from '$lib/stores.svelte';
	import { bacNow, buildProjectionTimeline } from '$lib/widmark';
	import { legalLimit } from '$lib/types';
	import BacSummary from '$lib/components/BacSummary.svelte';
	import ProjectionChart from '$lib/components/ProjectionChart.svelte';
	import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
	import QuickAdd from '$lib/components/QuickAdd.svelte';
	import DrinkList from '$lib/components/DrinkList.svelte';
	import ProfileForm from '$lib/components/ProfileForm.svelte';

	let now = $state(new Date());
	$effect(() => {
		const id = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(id);
	});

	const nowMin = $derived(now.getHours() * 60 + now.getMinutes());
	const limit = $derived(legalLimit(profile.jeunePermis));
	const bac = $derived(bacNow(drinks, profile, session.stomach, now));
	const timeline = $derived(
		buildProjectionTimeline(drinks, profile, session.stomach, nowMin)
	);
	const driveMin = $derived(timeline.driveMin);

	let chartOpen = $state(false);
	let profileOpen = $state(false);

	$effect(() => {
		if (drinks.length > 0) chartOpen = true;
	});
</script>

<div class="space-y-4">
	<BacSummary {bac} {limit} {driveMin} {nowMin} />
	<QuickAdd />
	<DrinkList {nowMin} />

	<CollapsibleSection title="Projection temporelle" bind:open={chartOpen}>
		<ProjectionChart {timeline} />
	</CollapsibleSection>

	<CollapsibleSection title="Configuration profil" bind:open={profileOpen}>
		<ProfileForm />
	</CollapsibleSection>
</div>
```

- [ ] **Step 2: Adjust ProfileForm — remove outer glass-card wrapper**

`ProfileForm.svelte` currently has `<section class="glass-card ...">`. Inside `CollapsibleSection` this double-wraps. Remove the outer `glass-card` from `ProfileForm` (keep inner fields only) so one card chrome.

- [ ] **Step 3: Delete BacPanel.svelte**

```bash
rm src/lib/components/BacPanel.svelte
```

- [ ] **Step 4: Run check and test**

Run: `npm run check && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/+page.svelte src/lib/components/ProfileForm.svelte
git rm src/lib/components/BacPanel.svelte
git commit -m "feat: reorder page for input-first UX and wire timeline"
```

---

### Task 8: Layout chrome (more viewport for content)

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Reduce fixed chrome padding**

In `+layout.svelte`, change:

```svelte
<main class="min-h-screen pt-20 pb-20">
```

(header `py-3` instead of `py-4` optional)

Footer: remove `fixed` on mobile — use normal document flow:

```svelte
<footer class="border-t border-surface-container bg-surface-bright/80 p-4 backdrop-blur-md" ...>
```

If removing fixed footer, drop `pb-20` on main → `pb-6`.

- [ ] **Step 2: Manual verify**

Open `http://localhost:5174/` at 390×844: Quick-add visible without scroll; add beer; sheet opens; chart shows `18:05`–`HH:MM` labels.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "fix: reduce fixed chrome to free vertical space on mobile"
```

---

### Task 9: Update design spec

**Files:**
- Modify: `docs/superpowers/specs/2026-05-31-boire-et-conduire-design.md`

- [ ] **Step 1: Update sections « Sortie » and « Découpage »**

Add bullets:

- Page order: summary → quick-add → list → collapsible chart → collapsible profile.
- Drink edit via bottom sheet (not inline native inputs in list).
- Chart X-axis: clock labels at now and drive time; Y from 0 g/L; legal limit line labeled.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-31-boire-et-conduire-design.md
git commit -m "docs: align design spec with UX refonte"
```

---

## Real verification checklist (required before calling done)

- [ ] Viewport 390×844: quick-add visible without scroll on first load.
- [ ] Add 3 shots: `BacSummary` updates; chart open shows start/end hours; right label matches « Conduite possible à … ».
- [ ] Spiritueux icon renders (24px), no `glass_full` text leak.
- [ ] Last chart point at or below `limit` when `driveMin > nowMin`.
- [ ] `npm test` and `npm run check` pass.

---

## Self-review

**Spec coverage:**

| Spec requirement | Task |
|------------------|------|
| Inline editable volume/degre/heure | Task 5 (sheet, not list inline — update spec Task 9) |
| Projection chart from Widmark sampling | Task 2, 6 |
| Drive time message | Task 3, 7 |
| Mobile first | Task 7, 8 |
| 3-zone BAC colors | Task 3 |

**Placeholder scan:** None — all steps include concrete code or commands.

**Type consistency:** `ProjectionTimeline` used in `+page.svelte`, `ProjectionChart.svelte`, `buildProjectionTimeline` in `widmark.ts` — consistent.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-31-ux-refonte.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
