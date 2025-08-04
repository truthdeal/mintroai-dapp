import { test, expect } from '@playwright/test';
import { Given, When, Then } from '@cucumber/cucumber';

// Test data
const POPULAR_WALLETS = [
  { name: 'Rainbow', icon: 'rainbow-wallet-icon' },
  { name: 'Coinbase Wallet', icon: 'coinbase-wallet-icon' },
  { name: 'MetaMask', icon: 'metamask-icon' },
  { name: 'WalletConnect', icon: 'walletconnect-icon' }
];

// Modal opening
Given('I am on the homepage', async ({ page }) => {
  await page.goto('/');
});

When('I click the {string} button', async ({ page }, buttonText: string) => {
  await page.click(`button:has-text("${buttonText}")`);
});

Then('I should see the wallet selection modal', async ({ page }) => {
  await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible();
});

// Tab visibility and selection
Then('I should see {string} tab selected by default', async ({ page }, tabName: string) => {
  const tab = page.locator(`[data-testid="wallet-tab-${tabName.toLowerCase()}"]`);
  await expect(tab).toBeVisible();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
});

Then('I should see {string} tab', async ({ page }, tabName: string) => {
  await expect(page.locator(`[data-testid="wallet-tab-${tabName.toLowerCase()}"]`)).toBeVisible();
});

// Popular wallets section
Given('the wallet selection modal is open', async ({ page }) => {
  await page.click('button:has-text("Connect Wallet")');
  await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible();
});

When('I am on the {string} tab', async ({ page }, tabName: string) => {
  await page.click(`[data-testid="wallet-tab-${tabName.toLowerCase()}"]`);
});

Then('I should see the following wallet options:', async ({ page }, dataTable) => {
  const wallets = dataTable.hashes();
  for (const wallet of wallets) {
    const walletOption = page.locator(`[data-testid="wallet-option-${wallet.wallet.toLowerCase()}"]`);
    await expect(walletOption).toBeVisible();
    await expect(walletOption.locator(`[data-testid="${wallet.icon}"]`)).toBeVisible();
  }
});

Then('MetaMask should be prominently displayed', async ({ page }) => {
  const metamask = page.locator('[data-testid="wallet-option-metamask"]');
  // Check if MetaMask is one of the first options
  const boundingBox = await metamask.boundingBox();
  expect(boundingBox?.y).toBeLessThan(300); // Should be near the top
});

Then('each wallet should have its icon and name', async ({ page }) => {
  for (const wallet of POPULAR_WALLETS) {
    const option = page.locator(`[data-testid="wallet-option-${wallet.name.toLowerCase()}"]`);
    await expect(option.locator(`[data-testid="${wallet.icon}"]`)).toBeVisible();
    await expect(option.locator('text=' + wallet.name)).toBeVisible();
  }
});

// NEAR wallet tab
When('I click on the {string} tab', async ({ page }, tabName: string) => {
  await page.click(`[data-testid="wallet-tab-${tabName.toLowerCase()}"]`);
});

Then('I should see the NEAR wallet options', async ({ page }) => {
  await expect(page.locator('[data-testid="near-wallets-section"]')).toBeVisible();
});

Then('I should see {string} as the first option', async ({ page }, walletName: string) => {
  const firstOption = page.locator('[data-testid="near-wallets-section"] > *').first();
  await expect(firstOption).toContainText(walletName);
});

Then('the {string} tab should be unselected', async ({ page }, tabName: string) => {
  const tab = page.locator(`[data-testid="wallet-tab-${tabName.toLowerCase()}"]`);
  await expect(tab).toHaveAttribute('aria-selected', 'false');
});

// Wallet selection
When('I click on the {string} option', async ({ page }, walletName: string) => {
  await page.click(`[data-testid="wallet-option-${walletName.toLowerCase()}"]`);
});

Then('the MetaMask extension popup should appear', async ({ context }) => {
  // Mock MetaMask popup
  await context.addInitScript(() => {
    window.ethereum = {
      isMetaMask: true,
      request: async () => ['0x1234...5678'],
    };
  });
});

Then('I should be redirected to NEAR wallet authorization', async ({ page }) => {
  // Check if navigation to NEAR wallet started
  const navigationPromise = page.waitForNavigation();
  await expect(page.url()).toContain('wallet.near.org');
  await navigationPromise;
});

Then('the modal should show a loading state', async ({ page }) => {
  await expect(page.locator('[data-testid="wallet-connecting-loader"]')).toBeVisible();
});

// Mobile responsiveness
Given('I am using a mobile device', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
});

Then('I should see the wallet selection modal in full screen', async ({ page }) => {
  const modal = page.locator('[data-testid="wallet-modal"]');
  const box = await modal.boundingBox();
  expect(box?.width).toBeCloseTo(375, -1);
  expect(box?.height).toBeCloseTo(812, -1);
});

// Modal closing
When('I click the close button', async ({ page }) => {
  await page.click('[data-testid="modal-close-button"]');
});

Then('the modal should close', async ({ page }) => {
  await expect(page.locator('[data-testid="wallet-modal"]')).not.toBeVisible();
});

// Accessibility
When('I press the Tab key', async ({ page }) => {
  await page.keyboard.press('Tab');
});

Then('I should see focus move between wallet options', async ({ page }) => {
  for (const wallet of POPULAR_WALLETS) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toContain(`wallet-option-${wallet.name.toLowerCase()}`);
  }
});

Then('I should be able to switch tabs with arrow keys', async ({ page }) => {
  await page.keyboard.press('ArrowRight');
  const nearTab = page.locator('[data-testid="wallet-tab-near"]');
  await expect(nearTab).toHaveAttribute('aria-selected', 'true');
});

Then('I should be able to close modal with Escape key', async ({ page }) => {
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-testid="wallet-modal"]')).not.toBeVisible();
});