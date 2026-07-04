import { test, expect, type Page } from '@playwright/test';
import { gotoApp, addDrink } from '../helpers/app';

test.describe('Status messages', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await gotoApp(page);
	});

	async function addBeersAt(page: Page, count: number, time: string) {
		for (let i = 0; i < count; i++) {
			await addDrink(page, 'Bière');
		}
		for (let i = 0; i < count; i++) {
			await page.getByLabel('Heure de consommation').nth(i).fill(time);
		}
	}

	test('E2E-087 E2E-170 @P0 Taux >= limite → Conduite interdite, pas Tu peux conduire', async ({
		page
	}) => {
		await addBeersAt(page, 4, '19:00');

		await expect(page.getByTestId('status-title')).toHaveText('Conduite interdite');
		await expect(page.getByTestId('drive-message')).not.toContainText('Tu peux conduire');
	});

	test('E2E-088 @P0 Taux entre 80% et 100% de la limite → Proche du seuil', async ({ page }) => {
		await addBeersAt(page, 3, '19:00');

		await expect(page.getByTestId('status-title')).toHaveText('Proche du seuil');
	});

	test('E2E-089 E2E-171 @P0 Absorption non terminee → Absorption en cours, pas Tu peux conduire', async ({
		page
	}) => {
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
		await expect(page.getByTestId('drive-message')).toContainText("Pas d'heure fiable sous 24 h");
		await expect(page.getByTestId('drive-message')).not.toContainText('Tu peux conduire');
	});
});
