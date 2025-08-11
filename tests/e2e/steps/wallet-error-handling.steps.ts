import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Error simulation steps
Given('the user rejects the connection', async function(this: CustomWorld) {
  if (!this.page) throw new Error('Page is not initialized');
  await this.page.addInitScript(() => {
    if (!(window as any).ethereum) {
      (window as any).ethereum = {};
    }
    (window as any).ethereum.request = async () => {
      throw new Error('User rejected the request.');
    };
  });
});

When('a connection error occurs', async function(this: CustomWorld) {
  if (!this.page) throw new Error('Page is not initialized');
  await this.page.addInitScript(() => {
    if (!(window as any).ethereum) {
      (window as any).ethereum = {};
    }
    (window as any).ethereum.request = async () => {
      throw new Error('Something went wrong.');
    };
  });
});

// Error message verification
Then('I should see an error message', async function(this: CustomWorld) {
  if (!this.page) throw new Error('Page is not initialized');
  const errorElement = this.page.locator('[data-testid="wallet-error-message"]');
  await expect(errorElement).toBeVisible({ timeout: 10000 });
});

Then('I should see a {string} button', async function(this: CustomWorld, buttonText: string) {
  if (!this.page) throw new Error('Page is not initialized');
  const button = this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeVisible({ timeout: 10000 });
});