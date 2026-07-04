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

		// Classic: BAC under 0.5 → not forbidden
		const statusClassic = await page.getByTestId('status-title').textContent();
		expect(statusClassic).not.toBe('Conduite interdite');

		// Jeune permis: limit 0.2 → over
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
