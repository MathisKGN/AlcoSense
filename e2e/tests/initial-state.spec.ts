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
