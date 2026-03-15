import { test as base, type Page, type BrowserContext } from '@playwright/test';

import { env } from '../helpers/onboarding-environment';
import { LoginPage } from '../pages/auth/LoginPage';

export interface OnboardingFlowState {
  adminPage: Page;
  adminContext: BrowserContext;
  adminCredentials: { email: string; password: string };
  invitationToken: string;
  invitationUrl: string;
  testUserEmail: string;
  userPassword: string;
  userPage: Page;
  userContext: BrowserContext;
  testUserId: string;
  gameId: string;
  gameTitle: string;
  agentId: string;
  gameSessionId: string;
}

export const sharedState: Partial<OnboardingFlowState> = {};

export async function ensureAdminAuth(page: Page): Promise<void> {
  const response = await page.request.get(`${env.apiURL}/api/v1/auth/me`);

  if (response.status() === 401) {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      sharedState.adminCredentials!.email,
      sharedState.adminCredentials!.password
    );
    await page.waitForURL('**/admin/**', { timeout: 10_000 });
  }
}

export const test = base.extend<{
  onboardingState: Partial<OnboardingFlowState>;
}>({
  onboardingState: async ({}, use) => {
    await use(sharedState);
  },
});

export { expect } from '@playwright/test';
