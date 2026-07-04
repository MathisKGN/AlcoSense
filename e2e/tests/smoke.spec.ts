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
