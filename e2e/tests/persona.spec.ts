import { test, expect } from '@playwright/test';
import { gotoApp, addDrink } from '../helpers/app';

test.describe('Persona', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-15T20:00:00') });
		await gotoApp(page);
	});

	test('E2E-148 @P0 3 bieres bues plus tot dans la soiree → pas Apte', async ({ page }) => {
		// Persona: a bu 3 bières en début de soirée (19:30), consulte l'app à 20:00.
		// À jeun, 3 bières standard plafonnent à ~0,49 g/L (juste sous 0,5) : une fois
		// absorbées, le taux courant place l'utilisateur en « Proche du seuil », pas « Apte ».
		await addDrink(page, 'Bière');
		await addDrink(page, 'Bière');
		await addDrink(page, 'Bière');
		for (let i = 0; i < 3; i++) {
			await page.getByLabel('Heure de consommation').nth(i).fill('19:30');
		}

		await expect(page.getByTestId('status-title')).not.toHaveText('Apte à la conduite');
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
		await page.locator('#weight').evaluate((el, v) => {
			(el as HTMLInputElement).value = String(v);
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
		await page.locator('#weight').evaluate((el, v) => {
			(el as HTMLInputElement).value = String(v);
			el.dispatchEvent(new Event('input', { bubbles: true }));
		}, 90);
		await page.getByRole('checkbox').uncheck({ force: true });

		const statusB = await page.getByTestId('status-title').textContent();

		// A (femme 55kg jeune permis) should be strictly more alarming than B (homme 90kg classique)
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
		await page.getByLabel("Degré d'alcool").first().fill('8');
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

		// Must show either "Conduite possible à" or "Pas d'heure fiable" or "Tu peux conduire"
		const driveText = await page.getByTestId('drive-message').textContent();
		const validMessage =
			driveText?.includes('Conduite possible à') ||
			driveText?.includes("Pas d'heure fiable") ||
			driveText?.includes('Tu peux conduire');
		expect(validMessage).toBe(true);
	});
});
