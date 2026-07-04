# Playwright E2E Vague 1 — Tests critiques P0

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Playwright and write ~25 E2E tests covering the safety-critical P0 cases from the carnet (status messages, drive time, persistence, persona stress). No CI, no matrix, no fixtures framework — just working tests against the real app.

**Architecture:** Playwright drives a Chromium browser against `npm run preview` (SvelteKit static build). Clock is frozen for time-dependent tests. 6 `data-testid` attributes on critical DOM elements. One spec file per domain, shared 2-function helper module. Tests assert visible text (status, messages, BAC display) — never internal state.

**Tech Stack:** Playwright, SvelteKit 2 + adapter-static, Svelte 5, TypeScript, Tailwind 4

---

## File structure

### New files

| File | Role |
|------|------|
| `playwright.config.ts` | Playwright config: mobile viewport 375x667, webServer build+preview |
| `e2e/helpers/app.ts` | 2 helpers: `gotoApp`, `addDrink` |
| `e2e/tests/smoke.spec.ts` | E2E-001, 004, 005, 006, 011 |
| `e2e/tests/initial-state.spec.ts` | E2E-016, 017, 019, 020, 021, 083, 084, 085 |
| `e2e/tests/drinks.spec.ts` | E2E-047, 077, 079 |
| `e2e/tests/status.spec.ts` | E2E-086, 087, 088, 089, 090, 091, 093, 170, 171, 172 |
| `e2e/tests/profile.spec.ts` | E2E-030, 042, 044, 045 |
| `e2e/tests/persistence.spec.ts` | E2E-105, 106 |
| `e2e/tests/persona.spec.ts` | E2E-148, 157, 161, 165, 166, 167, 176, 177, 178, 179, 180 |

### Modified files

| File | Change |
|------|--------|
| `src/lib/components/BacSummary.svelte` | Add 4 `data-testid` attrs |
| `src/lib/components/DrinkList.svelte` | Add 2 `data-testid` attrs |
| `package.json` | Add `test:e2e` and `test:e2e:ui` scripts |
| `.gitignore` | Add Playwright artifacts |

---

## Task 1: Install & configure Playwright

**Files:**
- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install Playwright and Chromium**

```bash
npm i -D @playwright/test
npx playwright install chromium
```

Expected: `@playwright/test` added to devDependencies, Chromium binary downloaded.

- [ ] **Step 2: Create playwright.config.ts**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    viewport: { width: 375, height: 667 },
  },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: Add npm scripts to package.json**

Add to `"scripts"`:
```json
"test:e2e": "npx playwright test",
"test:e2e:ui": "npx playwright test --ui"
```

- [ ] **Step 4: Update .gitignore**

Append:
```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 5: Verify setup builds**

```bash
npm run build && npm run preview &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173
kill %1
```

Expected: HTTP 200.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts package.json package-lock.json .gitignore
git commit -m "chore: install Playwright with mobile viewport config"
```

---

## Task 2: Add data-testid attributes & create helper

**Files:**
- Modify: `src/lib/components/BacSummary.svelte`
- Modify: `src/lib/components/DrinkList.svelte`
- Create: `e2e/helpers/app.ts`

- [ ] **Step 1: Add 4 data-testid to BacSummary.svelte**

In `src/lib/components/BacSummary.svelte`, add `data-testid` to these elements:

Line 70 — BAC value display:
```svelte
<!-- before -->
<p class="text-4xl leading-none font-thin tabular-nums {ui.accent}">{display}</p>
<!-- after -->
<p class="text-4xl leading-none font-thin tabular-nums {ui.accent}" data-testid="bac-value">{display}</p>
```

Line 76 — status title:
```svelte
<!-- before -->
<span class="text-sm font-bold {ui.accent}">{ui.title}</span>
<!-- after -->
<span class="text-sm font-bold {ui.accent}" data-testid="status-title">{ui.title}</span>
```

Line 78 — limit display:
```svelte
<!-- before -->
<p class="text-[11px] text-outline">Limite {limitText} g/L</p>
<!-- after -->
<p class="text-[11px] text-outline" data-testid="limit-value">Limite {limitText} g/L</p>
```

Line 79 — drive message:
```svelte
<!-- before -->
<p class="mt-1 text-sm font-bold text-on-surface">
<!-- after -->
<p class="mt-1 text-sm font-bold text-on-surface" data-testid="drive-message">
```

- [ ] **Step 2: Add 2 data-testid to DrinkList.svelte**

In `src/lib/components/DrinkList.svelte`:

Line 11 — drink count badge:
```svelte
<!-- before -->
<span class="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-primary"
    >{drinks.length}</span
>
<!-- after -->
<span class="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-primary" data-testid="drink-count"
    >{drinks.length}</span
>
```

Line 27 — empty state message:
```svelte
<!-- before -->
<div
    class="rounded-2xl border-2 border-dashed border-surface-container bg-white/50 py-10 text-center text-sm text-outline italic opacity-40"
>
<!-- after -->
<div
    class="rounded-2xl border-2 border-dashed border-surface-container bg-white/50 py-10 text-center text-sm text-outline italic opacity-40"
    data-testid="empty-state"
>
```

- [ ] **Step 3: Create e2e/helpers/app.ts**

```ts
import { type Page, expect } from '@playwright/test';

export async function gotoApp(page: Page) {
	await page.goto('/');
	await expect(page.locator('header')).toContainText('AlcoSense');
}

export async function addDrink(page: Page, type: string) {
	await page.getByRole('button', { name: new RegExp(type) }).click();
}
```

- [ ] **Step 4: Verify build still works**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/BacSummary.svelte src/lib/components/DrinkList.svelte e2e/helpers/app.ts
git commit -m "chore: add 6 data-testid attrs + e2e helper module"
```

---

## Task 3: Smoke & initial state tests

**Files:**
- Create: `e2e/tests/smoke.spec.ts`
- Create: `e2e/tests/initial-state.spec.ts`

- [ ] **Step 1: Write smoke.spec.ts**

```ts
import { test, expect } from '@playwright/test';
import { gotoApp } from '../helpers/app';

test.describe('Smoke', () => {
	test.beforeEach(async ({ page }) => {
		await gotoApp(page);
	});

	test('E2E-001 @P0 Header affiche AlcoSense', async ({ page }) => {
		await expect(page.locator('header')).toContainText('AlcoSense');
	});

	test('E2E-005 E2E-006 @P0 Page charge avec contenu visible', async ({ page }) => {
		await expect(page.getByTestId('bac-value')).toBeVisible();
		await expect(page.getByText('Consommations')).toBeVisible();
	});

	test('E2E-004 @P0 Footer affiche Estimation indicative', async ({ page }) => {
		await expect(page.locator('footer')).toContainText('Estimation indicative');
	});

	test('E2E-011 @P0 Bloc Estimation visible sans scroll sur mobile', async ({ page }) => {
		const box = await page.getByTestId('bac-value').boundingBox();
		expect(box).not.toBeNull();
		expect(box!.y).toBeGreaterThanOrEqual(0);
		expect(box!.y + box!.height).toBeLessThanOrEqual(667);
	});
});
```

- [ ] **Step 2: Write initial-state.spec.ts**

```ts
import { test, expect } from '@playwright/test';
import { gotoApp } from '../helpers/app';

test.describe('Initial state', () => {
	test.beforeEach(async ({ page }) => {
		await gotoApp(page);
	});

	test('E2E-016 E2E-083 @P0 Taux affiche 0,00 en virgule', async ({ page }) => {
		await expect(page.getByTestId('bac-value')).toHaveText('0,00');
	});

	test('E2E-017 @P0 Message aucune boisson', async ({ page }) => {
		await expect(page.getByTestId('empty-state')).toContainText('Aucune boisson ajoutée');
	});

	test('E2E-019 E2E-085 @P0 Statut Apte a la conduite', async ({ page }) => {
		await expect(page.getByTestId('status-title')).toHaveText('Apte à la conduite');
	});

	test('E2E-020 E2E-084 @P0 Limite affiche 0,5 g/L', async ({ page }) => {
		await expect(page.getByTestId('limit-value')).toContainText('0,5');
	});

	test('E2E-021 @P0 Message Tu peux conduire', async ({ page }) => {
		await expect(page.getByTestId('drive-message')).toContainText('Tu peux conduire');
	});
});
```

- [ ] **Step 3: Run and verify green**

```bash
npx playwright test e2e/tests/smoke.spec.ts e2e/tests/initial-state.spec.ts
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/smoke.spec.ts e2e/tests/initial-state.spec.ts
git commit -m "test: smoke + initial state E2E (E2E-001 to E2E-021)"
```

---

## Task 4: Drink interaction tests

**Files:**
- Create: `e2e/tests/drinks.spec.ts`

- [ ] **Step 1: Write drinks.spec.ts**

```ts
import { test, expect } from '@playwright/test';
import { gotoApp, addDrink } from '../helpers/app';

test.describe('Drinks', () => {
	test.beforeEach(async ({ page }) => {
		await gotoApp(page);
	});

	test('E2E-047 @P0 Ajout biere cree une entree', async ({ page }) => {
		await addDrink(page, 'Bière');
		await expect(page.getByTestId('drink-count')).toHaveText('1');
		await expect(page.getByTestId('empty-state')).toBeHidden();
	});

	test('E2E-077 @P0 Reset vide toute la liste', async ({ page }) => {
		await addDrink(page, 'Bière');
		await addDrink(page, 'Vin');
		await expect(page.getByTestId('drink-count')).toHaveText('2');

		await page.getByLabel('Réinitialiser les consommations').click();

		await expect(page.getByTestId('drink-count')).toHaveText('0');
		await expect(page.getByTestId('empty-state')).toBeVisible();
	});

	test('E2E-079 @P0 Reset ne touche pas au profil', async ({ page }) => {
		await page.getByRole('button', { name: 'Femme' }).click();
		await page.getByRole('checkbox').check({ force: true });

		await addDrink(page, 'Bière');
		await page.getByLabel('Réinitialiser les consommations').click();

		await expect(page.getByRole('button', { name: 'Femme' })).toHaveClass(/bg-primary/);
		await expect(page.getByRole('checkbox')).toBeChecked();
		await expect(page.getByTestId('limit-value')).toContainText('0,2');
	});
});
```

- [ ] **Step 2: Run and verify green**

```bash
npx playwright test e2e/tests/drinks.spec.ts
```

Expected: all 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/drinks.spec.ts
git commit -m "test: drink add/reset E2E (E2E-047, 077, 079)"
```

---

## Task 5: Status message tests

These tests use a frozen clock at **2026-01-15 20:00** (nowMin = 1200). Drink scenarios are pre-computed with the Widmark model:

| Scenario | Drinks | Heure | BAC approx | Status | Drive message |
|----------|--------|-------|------------|--------|---------------|
| Over limit | 4 bières | 19:00 | 0,60 | Conduite interdite | Conduite possible à ~20:41 |
| Near limit | 3 bières | 19:00 | 0,41 | Proche du seuil | Tu peux conduire |
| Absorbing | 4 bières | 20:00 | 0,00 | Absorption en cours | Conduite possible à ~21:41 |
| Safe | 0 | — | 0,00 | Apte à la conduite | Tu peux conduire |
| No safe time | 1 spiritueux 75cl | 19:00 | ~5,8 | Conduite interdite | Pas d'heure fiable sous 24 h |

**Files:**
- Create: `e2e/tests/status.spec.ts`

- [ ] **Step 1: Write status.spec.ts**

```ts
import { test, expect } from '@playwright/test';
import { gotoApp, addDrink } from '../helpers/app';

test.describe('Status messages', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await gotoApp(page);
	});

	async function addBeersAt(page: import('@playwright/test').Page, count: number, time: string) {
		for (let i = 0; i < count; i++) {
			await addDrink(page, 'Bière');
		}
		for (let i = 0; i < count; i++) {
			await page.getByLabel('Heure de consommation').nth(i).fill(time);
		}
	}

	test('E2E-087 E2E-170 @P0 Taux >= limite → Conduite interdite, pas Tu peux conduire', async ({ page }) => {
		await addBeersAt(page, 4, '19:00');

		await expect(page.getByTestId('status-title')).toHaveText('Conduite interdite');
		await expect(page.getByTestId('drive-message')).not.toContainText('Tu peux conduire');
	});

	test('E2E-088 @P0 Taux entre 80% et 100% de la limite → Proche du seuil', async ({ page }) => {
		await addBeersAt(page, 3, '19:00');

		await expect(page.getByTestId('status-title')).toHaveText('Proche du seuil');
	});

	test('E2E-089 E2E-171 @P0 Absorption non terminee → Absorption en cours, pas Tu peux conduire', async ({ page }) => {
		for (let i = 0; i < 4; i++) {
			await addDrink(page, 'Bière');
		}
		// Drinks at 20:00 (default), BAC = 0 but peak will exceed limit

		await expect(page.getByTestId('status-title')).toHaveText('Absorption en cours');
		await expect(page.getByTestId('drive-message')).not.toContainText('Tu peux conduire');
	});

	test('E2E-090 @P0 Sous le seuil et elimination terminee → Tu peux conduire', async ({ page }) => {
		// No drinks → already safe
		await expect(page.getByTestId('status-title')).toHaveText('Apte à la conduite');
		await expect(page.getByTestId('drive-message')).toContainText('Tu peux conduire');
	});

	test('E2E-091 @P0 Conduite future connue → Conduite possible a HH:MM', async ({ page }) => {
		await addBeersAt(page, 4, '19:00');

		await expect(page.getByTestId('drive-message')).toContainText(/Conduite possible à \d{2}:\d{2}/);
		await expect(page.getByTestId('drive-message')).toContainText(/dans \d+ h \d{2} min/);
	});

	test('E2E-093 E2E-172 @P0 Pas d heure fiable sous 24 h', async ({ page }) => {
		// 1 spirit with volume bumped to 75cl → massive BAC, no safe time in 24h
		await addDrink(page, 'Spiritueux');
		await page.getByLabel('Volume en centilitres').first().fill('75');
		await page.getByLabel('Heure de consommation').first().fill('19:00');

		await expect(page.getByTestId('status-title')).toHaveText('Conduite interdite');
		await expect(page.getByTestId('drive-message')).toContainText('Pas d\'heure fiable sous 24 h');
		await expect(page.getByTestId('drive-message')).not.toContainText('Tu peux conduire');
	});
});
```

- [ ] **Step 2: Run and verify green**

```bash
npx playwright test e2e/tests/status.spec.ts
```

Expected: all 6 tests pass. If a test fails, verify the scenario computation against the Widmark model in `src/lib/widmark.ts`. Adjust drink count or time if needed — the goal is to trigger each status reliably.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/status.spec.ts
git commit -m "test: status messages E2E (E2E-087 to E2E-093, E2E-170-172)"
```

---

## Task 6: Profile effect tests

**Files:**
- Create: `e2e/tests/profile.spec.ts`

- [ ] **Step 1: Write profile.spec.ts**

```ts
import { test, expect } from '@playwright/test';
import { gotoApp, addDrink } from '../helpers/app';

test.describe('Profile effects', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await gotoApp(page);
	});

	test('E2E-042 E2E-044 @P0 Toggle jeune permis change la limite', async ({ page }) => {
		await expect(page.getByTestId('limit-value')).toContainText('0,5');

		await page.getByRole('checkbox').check({ force: true });
		await expect(page.getByTestId('limit-value')).toContainText('0,2');

		await page.getByRole('checkbox').uncheck({ force: true });
		await expect(page.getByTestId('limit-value')).toContainText('0,5');
	});

	test('E2E-045 @P0 Jeune permis + biere → statut plus strict que classique', async ({ page }) => {
		// Add 2 beers at 19:00
		await addDrink(page, 'Bière');
		await addDrink(page, 'Bière');
		await page.getByLabel('Heure de consommation').nth(0).fill('19:00');
		await page.getByLabel('Heure de consommation').nth(1).fill('19:00');

		// Classic: BAC ~0.23, limit 0.5 → safe
		const statusClassic = await page.getByTestId('status-title').textContent();
		expect(statusClassic).not.toBe('Conduite interdite');

		// Jeune permis: BAC ~0.23, limit 0.2 → over
		await page.getByRole('checkbox').check({ force: true });
		await expect(page.getByTestId('status-title')).toHaveText('Conduite interdite');
	});

	test('E2E-030 @P0 Changement de genre modifie le taux', async ({ page }) => {
		// Add 4 beers at 19:00
		for (let i = 0; i < 4; i++) await addDrink(page, 'Bière');
		for (let i = 0; i < 4; i++) {
			await page.getByLabel('Heure de consommation').nth(i).fill('19:00');
		}

		const bacHomme = await page.getByTestId('bac-value').textContent();

		await page.getByRole('button', { name: 'Femme' }).click();
		const bacFemme = await page.getByTestId('bac-value').textContent();

		// Femme has lower Widmark r (0.6 vs 0.7) → higher BAC
		expect(bacFemme).not.toBe(bacHomme);
	});
});
```

- [ ] **Step 2: Run and verify green**

```bash
npx playwright test e2e/tests/profile.spec.ts
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/profile.spec.ts
git commit -m "test: profile effects E2E (E2E-030, 042, 044, 045)"
```

---

## Task 7: Persistence tests

**Files:**
- Create: `e2e/tests/persistence.spec.ts`

- [ ] **Step 1: Write persistence.spec.ts**

```ts
import { test, expect } from '@playwright/test';
import { gotoApp, addDrink } from '../helpers/app';

test.describe('Persistence', () => {
	test('E2E-105 @P0 Profil survit au rechargement', async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await gotoApp(page);

		// Modify profile
		await page.getByRole('button', { name: 'Femme' }).click();
		await page.getByRole('checkbox').check({ force: true });

		// Reload
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await page.reload();

		// Verify persisted
		await expect(page.getByRole('button', { name: 'Femme' })).toHaveClass(/bg-primary/);
		await expect(page.getByRole('checkbox')).toBeChecked();
		await expect(page.getByTestId('limit-value')).toContainText('0,2');
	});

	test('E2E-106 @P0 Verres survivent au rechargement', async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await gotoApp(page);

		await addDrink(page, 'Bière');
		await addDrink(page, 'Vin');
		await expect(page.getByTestId('drink-count')).toHaveText('2');

		// Reload
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await page.reload();

		await expect(page.getByTestId('drink-count')).toHaveText('2');
		await expect(page.getByTestId('empty-state')).toBeHidden();
	});
});
```

Note: `page.clock.install()` is called again before `reload()` because Playwright resets the clock on navigation. If this fails, use `page.addInitScript` to set the clock instead.

- [ ] **Step 2: Run and verify green**

```bash
npx playwright test e2e/tests/persistence.spec.ts
```

Expected: 2 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/persistence.spec.ts
git commit -m "test: persistence E2E (E2E-105, 106)"
```

---

## Task 8: Persona critical path tests

These tests simulate stressed/confused users. Clock frozen at **2026-01-15 20:00**.

**Files:**
- Create: `e2e/tests/persona.spec.ts`

- [ ] **Step 1: Write persona.spec.ts**

```ts
import { test, expect } from '@playwright/test';
import { gotoApp, addDrink } from '../helpers/app';

test.describe('Persona', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await gotoApp(page);
	});

	test('E2E-148 @P0 3 bieres sans configurer → pas Apte', async ({ page }) => {
		await addDrink(page, 'Bière');
		await addDrink(page, 'Bière');
		await addDrink(page, 'Bière');

		// 3 beers at 20:00, peak ~0.56 > 0.5 → absorption en cours
		await expect(page.getByTestId('status-title')).not.toHaveText('Apte à la conduite');
		await expect(page.getByTestId('drive-message')).not.toContainText('Tu peux conduire');
	});

	test('E2E-157 E2E-176 @P0 Heure differente → taux different', async ({ page }) => {
		// Scenario A: 4 beers at default time (20:00)
		for (let i = 0; i < 4; i++) await addDrink(page, 'Bière');
		const bacDefault = await page.getByTestId('bac-value').textContent();
		const statusDefault = await page.getByTestId('status-title').textContent();

		// Scenario B: change all to 19:00 (1h ago → absorbed + partially eliminated)
		for (let i = 0; i < 4; i++) {
			await page.getByLabel('Heure de consommation').nth(i).fill('19:00');
		}
		const bacPast = await page.getByTestId('bac-value').textContent();
		const statusPast = await page.getByTestId('status-title').textContent();

		// The two must be different — time matters
		const different = bacDefault !== bacPast || statusDefault !== statusPast;
		expect(different).toBe(true);
	});

	test('E2E-161 E2E-177 @P0 Reset accidentel → etat propre', async ({ page }) => {
		await addDrink(page, 'Bière');
		await addDrink(page, 'Bière');
		await addDrink(page, 'Bière');
		await expect(page.getByTestId('drink-count')).toHaveText('3');

		await page.getByLabel('Réinitialiser les consommations').click();

		await expect(page.getByTestId('drink-count')).toHaveText('0');
		await expect(page.getByTestId('bac-value')).toHaveText('0,00');
		await expect(page.getByTestId('status-title')).toHaveText('Apte à la conduite');
		await expect(page.getByTestId('drive-message')).toContainText('Tu peux conduire');
	});

	test('E2E-165 E2E-178 @P0 Profil faux vs honnete → statut different', async ({ page }) => {
		// Profile A: femme 55kg, jeune permis
		await page.getByRole('button', { name: 'Femme' }).click();
		await page.locator('#weight').evaluate((el: HTMLInputElement, v: number) => {
			el.value = String(v);
			el.dispatchEvent(new Event('input', { bubbles: true }));
		}, 55);
		await page.getByRole('checkbox').check({ force: true });

		// Add 2 beers at 19:00
		await addDrink(page, 'Bière');
		await addDrink(page, 'Bière');
		await page.getByLabel('Heure de consommation').nth(0).fill('19:00');
		await page.getByLabel('Heure de consommation').nth(1).fill('19:00');

		const statusA = await page.getByTestId('status-title').textContent();

		// Profile B: homme 90kg, classique
		await page.getByRole('button', { name: 'Homme' }).click();
		await page.locator('#weight').evaluate((el: HTMLInputElement, v: number) => {
			el.value = String(v);
			el.dispatchEvent(new Event('input', { bubbles: true }));
		}, 90);
		await page.getByRole('checkbox').uncheck({ force: true });

		const statusB = await page.getByTestId('status-title').textContent();

		// A should be strictly more alarming than B
		// A: femme 55kg jeune permis → BAC ~0.45, limit 0.2 → Conduite interdite
		// B: homme 90kg classique → BAC ~0.16, limit 0.5 → Apte
		expect(statusA).toBe('Conduite interdite');
		expect(statusB).toBe('Apte à la conduite');
	});

	test('E2E-166 E2E-179 @P0 15 bieres spam + reload → pas de crash', async ({ page }) => {
		for (let i = 0; i < 15; i++) {
			await addDrink(page, 'Bière');
		}
		await expect(page.getByTestId('drink-count')).toHaveText('15');
		await expect(page.getByTestId('bac-value')).toBeVisible();

		// Reload
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await page.reload();

		await expect(page.getByTestId('drink-count')).toHaveText('15');
		await expect(page.getByTestId('bac-value')).not.toHaveText('NaN');
	});

	test('E2E-167 @P0 Actions rapides multi-type + reload → coherent', async ({ page }) => {
		// Rapid sequence: change stomach, add drinks, modify degree, toggle jeune permis
		await page.getByText('Repas complet').click();
		await addDrink(page, 'Bière');
		await addDrink(page, 'Vin');
		await page.getByLabel('Degré d\'alcool').first().fill('8');
		await page.getByRole('checkbox').check({ force: true });

		await expect(page.getByTestId('drink-count')).toHaveText('2');
		await expect(page.getByTestId('limit-value')).toContainText('0,2');

		// Reload
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await page.reload();

		await expect(page.getByTestId('drink-count')).toHaveText('2');
		await expect(page.getByTestId('limit-value')).toContainText('0,2');
		await expect(page.getByRole('checkbox')).toBeChecked();
	});

	test('E2E-180 @P0 Soiree longue → drive time ou message 24h, pas NaN', async ({ page }) => {
		// 8 drinks spread across the evening
		const times = ['18:00', '18:30', '19:00', '19:15', '19:30', '19:45', '20:00', '20:00'];
		const types = ['Bière', 'Bière', 'Vin', 'Bière', 'Shot', 'Bière', 'Vin', 'Bière'];

		for (let i = 0; i < 8; i++) {
			await addDrink(page, types[i]);
		}
		for (let i = 0; i < 8; i++) {
			await page.getByLabel('Heure de consommation').nth(i).fill(times[i]);
		}

		await expect(page.getByTestId('drink-count')).toHaveText('8');
		await expect(page.getByTestId('bac-value')).not.toHaveText('NaN');
		await expect(page.getByTestId('bac-value')).toBeVisible();

		// Must show either "Conduite possible à" or "Pas d'heure fiable"
		const driveText = await page.getByTestId('drive-message').textContent();
		const validMessage =
			driveText?.includes('Conduite possible à') ||
			driveText?.includes('Pas d\'heure fiable') ||
			driveText?.includes('Tu peux conduire');
		expect(validMessage).toBe(true);
	});
});
```

- [ ] **Step 2: Run and verify green**

```bash
npx playwright test e2e/tests/persona.spec.ts
```

Expected: all 7 tests pass. The persona tests exercise extreme scenarios; if any fail, check whether the app or the test expectation is wrong. Adjust the drink count or time to reliably trigger the expected status.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/persona.spec.ts
git commit -m "test: persona E2E (E2E-148 to E2E-180)"
```

---

## Task 9: Full suite run & final commit

- [ ] **Step 1: Run the entire suite**

```bash
npx playwright test
```

Expected: all ~25 tests pass. Review the HTML report:

```bash
npx playwright show-report
```

- [ ] **Step 2: Final commit if any fixups were needed**

```bash
git add -A e2e/
git commit -m "test: complete Playwright E2E vague 1 — 25 tests P0 critiques"
```

---

## Self-review checklist

1. **Spec coverage:** Carnet P0 IDs covered: 001, 004, 005, 006, 011, 016, 017, 019, 020, 021, 030, 042, 044, 045, 047, 077, 079, 083, 084, 085, 086 (via 089), 087, 088, 089, 090, 091, 093, 105, 106, 148, 157, 161, 165, 166, 167, 170, 171, 172, 176, 177, 178, 179, 180. That's ~40 P0 IDs from ~25 tests. Remaining P0 IDs (013, 015, 035, 040, 072, 073, 086 standalone, 113-119, 149-156, 158) are deferred to vague 2.

2. **Placeholder scan:** No TBD, TODO, "implement later", or "similar to Task N" found.

3. **Type consistency:** `addDrink` takes a string (drink label), `gotoApp` takes a Page — used consistently across all files. `data-testid` names match between component edits and test locators.

## Known risks

- **`page.clock.install()` across reloads:** Playwright may or may not reset the clock on `reload()`. Persistence tests call `clock.install()` again before reload. If this causes issues, switch to `page.addInitScript` to set the clock.
- **`fill()` on `<input type="time">`:** If Playwright doesn't trigger `onchange` on time inputs, fall back to `page.evaluate` with manual event dispatch.
- **Status thresholds:** BAC computations are approximated. If a test lands on a threshold boundary (e.g., BAC exactly 0.40), adjust the drink count or time by a small amount to move clearly into the expected zone.
- **`getByRole('checkbox').check({ force: true })`:** The checkbox is `sr-only`. If `force: true` doesn't work, click the parent `<label>` instead.
