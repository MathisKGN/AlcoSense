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
