import { type Page, expect } from '@playwright/test';

export async function gotoApp(page: Page) {
	await page.goto('/');
	await expect(page.locator('header')).toContainText('AlcoSense');
}

export async function addDrink(page: Page, type: string) {
	await page.getByRole('button', { name: new RegExp(type) }).click();
}
