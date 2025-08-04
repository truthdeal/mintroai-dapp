import { test, expect } from '@playwright/test';
import { Given, When, Then } from '@cucumber/cucumber';

// Mock data and helpers
const MOCK_ADDRESS = '0x1234...5678';
const MOCK_FULL_ADDRESS = '0x1234567890123456789012345678901234567890';

// Custom assertions
async function expectToBeVisible(page: any, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
}

// Background
Given('I am on the homepage', async ({ page }) => {
  await page.goto('/');
});

// Wallet Detection
When('the page loads completely', async ({ page }) => {
  await page.waitForLoadState('networkidle');
});

Then('I should see a {string} button', async ({ page }, buttonText: string) => {
  await expectToBeVisible(page, `button:has-text("${buttonText}")`);
});

Then('the system should detect available wallets', async ({ page }) => {
  // Wait for wallet detection to complete
  await page.waitForResponse(response => 
    response.url().includes('/api/wallet-detection') && 
    response.status() === 200
  );
});

// MetaMask Scenarios
Given('MetaMask is installed in the browser', async ({ context }) => {
  await context.addInitScript(() => {
    window.ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts') {
          return [MOCK_ADDRESS];
        }
        return null;
      },
    };
  });
});

Given('MetaMask is installed and unlocked', async ({ context }) => {
  await context.addInitScript(() => {
    window.ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts') {
          return [MOCK_ADDRESS];
        }
        if (method === 'eth_accounts') {
          return [MOCK_ADDRESS];
        }
        return null;
      },
      isUnlocked: async () => true,
    };
  });
});

When('I click the {string} button', async ({ page }, buttonText: string) => {
  await page.click(`button:has-text("${buttonText}")`);
});

Then('I should see a wallet selection modal', async ({ page }) => {
  await expectToBeVisible(page, '[data-testid="wallet-selection-modal"]');
});

When('I select {string} from the options', async ({ page }, option: string) => {
  await page.click(`[data-testid="wallet-option-${option.toLowerCase()}"]`);
});

Then('MetaMask connection popup should appear', async ({ page }) => {
  // MetaMask popup is handled by the mock
  await page.waitForTimeout(500); // Small delay to simulate popup
});

Then('I should see my wallet address in truncated format', async ({ page }) => {
  const truncatedAddress = await page.textContent('[data-testid="wallet-address"]');
  expect(truncatedAddress).toContain('0x1234...5678');
});

// Loading States
When('the connection request is processing', async ({ page }) => {
  await expectToBeVisible(page, '[data-testid="connection-loading"]');
});

Then('I should see a loading spinner', async ({ page }) => {
  await expectToBeVisible(page, '[data-testid="loading-spinner"]');
});

Then('the connect button should be disabled', async ({ page }) => {
  const button = page.locator('[data-testid="connect-wallet-button"]');
  await expect(button).toBeDisabled();
});

// Error Handling
Given('MetaMask is installed but locked', async ({ context }) => {
  await context.addInitScript(() => {
    window.ethereum = {
      isMetaMask: true,
      request: async () => {
        throw new Error('Wallet is locked');
      },
      isUnlocked: async () => false,
    };
  });
});

Then('I should see an error message {string}', async ({ page }, message: string) => {
  await expectToBeVisible(page, `[data-testid="error-message"]:has-text("${message}")`);
});

// Network Handling
Given('I am on an unsupported network', async ({ context }) => {
  await context.addInitScript(() => {
    window.ethereum = {
      ...window.ethereum,
      networkVersion: '999', // Unsupported network ID
      chainId: '0x999',
    };
  });
});

Then('I should see a network warning message', async ({ page }) => {
  await expectToBeVisible(page, '[data-testid="network-warning"]');
});

When('I click {string}', async ({ page }, buttonText: string) => {
  await page.click(`button:has-text("${buttonText}")`);
});

// Mobile Scenarios
Given('I am using a mobile device', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });
});

Then('I should see {string} as a primary option', async ({ page }, option: string) => {
  const element = page.locator(`[data-testid="primary-wallet-option"]:has-text("${option}")`);
  await expect(element).toBeVisible();
  // Verify it's the first option
  const position = await element.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top;
  });
  expect(position).toBeLessThan(400); // Should be near the top of the modal
});

// Rejection Handling
When('I reject the connection in MetaMask', async ({ context }) => {
  await context.addInitScript(() => {
    window.ethereum.request = async () => {
      throw new Error('User rejected the request');
    };
  });
});

Then('the wallet selection modal should remain open', async ({ page }) => {
  await expectToBeVisible(page, '[data-testid="wallet-selection-modal"]');
});