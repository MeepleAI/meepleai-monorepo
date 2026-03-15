import { test, expect, sharedState, ensureAdminAuth } from '../fixtures/onboarding-flow.fixture';
import { extractInvitation } from '../helpers/email-strategy';
import { cleanupOnboardingTest } from '../helpers/onboarding-cleanup';
import { env } from '../helpers/onboarding-environment';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AuditLogPage } from '../pages/admin/AuditLogPage';
import { AgentChatPage } from '../pages/agent/AgentChatPage';
import { AgentCreationPage } from '../pages/agent/AgentCreationPage';
import { AcceptInvitePage } from '../pages/auth/AcceptInvitePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { LibraryPage } from '../pages/library/LibraryPage';

const timestamp = Date.now();
const testUserEmail =
  env.email.strategy === 'mailosaur'
    ? `e2e-onboarding-${timestamp}@${env.email.mailosaurServerId}.mailosaur.net`
    : `e2e-onboarding-${timestamp}@test.local`;
const testUserPassword = `E2eTest!${timestamp}`;

test.describe.configure({ mode: 'serial' });

test.describe('Admin-User Onboarding Flow', () => {
  test.afterAll(async ({ browser }) => {
    if (sharedState.adminPage) {
      try {
        await cleanupOnboardingTest(sharedState.adminPage.request, {
          testUserId: sharedState.testUserId,
          agentId: sharedState.agentId,
        });
      } catch (e) {
        console.warn('Cleanup failed (orphaned test data may remain):', e);
      }
    }

    if (sharedState.userContext) await sharedState.userContext.close();
    if (sharedState.adminContext) await sharedState.adminContext.close();
  });

  // ── Test 1: Admin Login ──────────────────────────────────────
  test('1. Admin logs in', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await test.step('Navigate to login', async () => {
      const loginPage = new LoginPage(adminPage);
      await loginPage.goto();
      await loginPage.login(env.admin.email, env.admin.password);
    });

    await test.step('Verify admin dashboard', async () => {
      await adminPage.waitForURL(
        url => url.pathname.includes('/admin') || url.pathname.includes('/dashboard'),
        { timeout: 15_000 }
      );

      // Verify admin display name visible in navbar
      const userInfo = adminPage
        .locator('[data-testid="user-display-name"], [data-testid="navbar-user"]')
        .or(adminPage.getByText(env.admin.email));
      await expect(userInfo).toBeVisible({ timeout: 5_000 });

      // Verify no error toasts
      const errorToast = adminPage.locator('[data-testid="toast-error"], .toast-error');
      await expect(errorToast).not.toBeVisible();
    });

    sharedState.adminPage = adminPage;
    sharedState.adminContext = adminContext;
    sharedState.adminCredentials = env.admin;
  });

  // ── Test 2: Admin Invites User ───────────────────────────────
  test('2. Admin invites user via email', async () => {
    const page = sharedState.adminPage!;
    const adminUsersPage = new AdminUsersPage(page);

    await test.step('Open invite dialog', async () => {
      await adminUsersPage.goto();
      await adminUsersPage.clickInviteButton();
    });

    await test.step('Fill and send invitation', async () => {
      await adminUsersPage.fillInvitationForm(testUserEmail, 'user');
      await adminUsersPage.submitInvitation();
      await adminUsersPage.waitForNetworkIdle();
    });

    await test.step('Extract invitation token/URL', async () => {
      const result = await extractInvitation(page, testUserEmail);
      sharedState.invitationToken = result.invitationToken;
      sharedState.invitationUrl = result.invitationUrl;
      sharedState.testUserEmail = testUserEmail;
    });

    expect(sharedState.invitationToken).toBeTruthy();
  });

  // ── Test 3: User Accepts Invitation ──────────────────────────
  test('3. User accepts invitation and sets password', async ({ browser }) => {
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    const acceptPage = new AcceptInvitePage(userPage);

    await test.step('Navigate to accept-invite page', async () => {
      if (env.email.strategy === 'mailosaur') {
        await acceptPage.gotoUrl(sharedState.invitationUrl!);
      } else {
        await acceptPage.gotoWithToken(sharedState.invitationToken!);
      }
    });

    await test.step('Set password', async () => {
      await acceptPage.setPassword(testUserPassword);
      await acceptPage.verifyStrengthIndicator('Strong');
    });

    await test.step('Submit and wait for redirect', async () => {
      await acceptPage.submit();
      await acceptPage.waitForRedirectToOnboarding();
    });

    sharedState.userPassword = testUserPassword;
    sharedState.userPage = userPage;
    sharedState.userContext = userContext;
  });

  // ── Test 4: User Logs In ─────────────────────────────────────
  test('4. User logs in with new password', async () => {
    const page = sharedState.userPage!;
    const loginPage = new LoginPage(page);

    await test.step('Navigate to login and authenticate', async () => {
      await loginPage.goto();
      await loginPage.login(testUserEmail, testUserPassword);
    });

    await test.step('Verify dashboard redirect', async () => {
      await page.waitForURL(
        url =>
          url.pathname.includes('/dashboard') ||
          url.pathname.includes('/library') ||
          url.pathname.includes('/'),
        { timeout: 15_000 }
      );

      const errorToast = page.locator('[data-testid="toast-error"], .toast-error');
      await expect(errorToast).not.toBeVisible();
    });

    await test.step('Capture user ID', async () => {
      try {
        const meResponse = await page.request.get(`${env.apiURL}/api/v1/auth/me`);
        if (meResponse.ok()) {
          const meData = await meResponse.json();
          sharedState.testUserId = meData.id ?? meData.userId ?? '';
        }
      } catch {
        console.warn('Could not capture testUserId from /auth/me');
      }
    });
  });

  // ── Test 5: User Adds Game to Collection ─────────────────────
  test('5. User adds game to collection', async () => {
    const page = sharedState.userPage!;
    const libraryPage = new LibraryPage(page);

    await test.step('Navigate to library', async () => {
      await libraryPage.goto();
    });

    await test.step('Search and add game', async () => {
      await libraryPage.clickAddGame();
      await libraryPage.searchGame(env.seedGameName);

      const { gameId, gameTitle } = await libraryPage.selectFirstSearchResult();

      if (!gameId && env.name === 'local') {
        throw new Error(
          `Seed game "${env.seedGameName}" not found. Ensure DB is seeded via: dotnet ef database update`
        );
      }

      sharedState.gameId = gameId;
      sharedState.gameTitle = gameTitle || env.seedGameName;
    });

    await test.step('Confirm and verify', async () => {
      await libraryPage.confirmAddToCollection();
      await libraryPage.verifyGameInCollection(sharedState.gameTitle!);
    });
  });

  // ── Test 6: User Creates Agent ───────────────────────────────
  test('6. User creates agent for the game', async () => {
    const page = sharedState.userPage!;
    const agentPage = new AgentCreationPage(page);

    await test.step('Open agent creation', async () => {
      await agentPage.goto();
      await agentPage.openCreationSheet();
    });

    await test.step('Configure agent', async () => {
      await agentPage.selectGame(sharedState.gameTitle!);
      await agentPage.selectStrategy('Tutor');
      await agentPage.selectFreeTier();
    });

    await test.step('Submit and capture IDs', async () => {
      const result = await agentPage.submitCreation();
      sharedState.agentId = result.agentId;
      sharedState.gameSessionId = result.gameSessionId;

      expect(sharedState.agentId).toBeTruthy();
    });

    await test.step('Wait for agent ready', async () => {
      await agentPage.waitForAgentReady(env.timeouts.agentReady);
    });
  });

  // ── Test 7: User Chats with Agent ────────────────────────────
  test('7. User asks agent about game scope and turn', async () => {
    const page = sharedState.userPage!;
    const chatPage = new AgentChatPage(page);

    await test.step('Open chat with agent', async () => {
      await chatPage.navigateToChat(sharedState.agentId!);
    });

    await test.step('Send question and wait for response', async () => {
      const gameTitle = sharedState.gameTitle!;
      await chatPage.sendMessage(
        `Qual è lo scopo del gioco ${gameTitle}? Descrivimi un turno di gioco.`
      );

      const responseText = await chatPage.waitForAgentResponse(env.timeouts.chatResponse);

      await chatPage.verifyResponseIsValid(responseText);
    });
  });

  // ── Test 8: Admin Changes Role & Checks Audit Log ────────────
  test('8. Admin changes user role and verifies audit log', async () => {
    const page = sharedState.adminPage!;

    await ensureAdminAuth(page);

    const adminUsersPage = new AdminUsersPage(page);
    const auditLogPage = new AuditLogPage(page);

    await test.step('Change user role to editor', async () => {
      await adminUsersPage.goto();
      await adminUsersPage.changeUserRole(testUserEmail, 'editor');
      await adminUsersPage.waitForNetworkIdle();
    });

    await test.step('Verify role changed in UI', async () => {
      await adminUsersPage.verifyUserRole(testUserEmail, 'editor');
    });

    await test.step('Verify audit log entry', async () => {
      await auditLogPage.goto();
      await auditLogPage.verifyRoleChangeEntry(testUserEmail, {
        newRole: 'editor',
      });
    });
  });
});
