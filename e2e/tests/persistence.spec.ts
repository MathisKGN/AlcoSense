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
