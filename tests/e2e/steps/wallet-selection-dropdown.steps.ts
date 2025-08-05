import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am on the homepage', async function(this: CustomWorld) {
  if (!this.page) throw new Error('Page is not initialized');
  await this.page.goto('http://localhost:3000');
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(2000);

  // Sayfa boş gelirse refresh at
  const content = await this.page.content();
  if (!content.includes('Connect Wallet')) {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }
});

When('I click the {string} button', async function(this: CustomWorld, buttonText: string) {
  if (!this.page) throw new Error('Page is not initialized');
  const button = this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
});

Then('I should see the wallet selection dropdown', async function(this: CustomWorld) {
  if (!this.page) throw new Error('Page is not initialized');
  const dropdown = this.page.locator('[role="menu"]');
  await expect(dropdown).toBeVisible({ timeout: 10000 });
});

Then('I should see both EVM and NEAR wallet options', async function(this: CustomWorld) {
  if (!this.page) throw new Error('Page is not initialized');
  const popularOption = this.page.locator('[data-testid="wallet-option-popular"]');
  const nearOption = this.page.locator('[data-testid="wallet-option-near"]');
  await expect(popularOption).toBeVisible({ timeout: 10000 });
  await expect(nearOption).toBeVisible({ timeout: 10000 });
});