import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
    test('Admin can login and view dashboard', async ({ page }) => {
        await page.goto('/');

        // Fill in login credentials (using default ones from seed_admins.py)
        await page.fill('input[placeholder="Admin Email"]', 'admin@officeflow.ai');
        await page.fill('input[placeholder="Password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for navigation to dashboard - check for Dashboard heading
        await page.waitForURL(/.*dashboard/, { timeout: 10000 });
        await expect(page.locator('text=System Overview')).toBeVisible({ timeout: 10000 });
    });

    test('Admin can list employees', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[placeholder="Admin Email"]', 'admin@officeflow.ai');
        await page.fill('input[placeholder="Password"]', 'admin123');
        await page.click('button:has-text("Enter Dashboard")');

        // Ensure login navigation completed before navigating to employees page
        await page.waitForURL(/.*dashboard/, { timeout: 10000 });

        // Navigate via sidebar like a real user
        await page.click('text=Employee Mgmt');
        await expect(page.locator('text=Employee Directory')).toBeVisible({ timeout: 10000 });
    });

    test('Organization Registration and Owner Login', async ({ page }) => {
        const email = `owner-${Date.now()}@test.com`;

        await page.goto('/register-org');
        await page.fill('input[name="org_name"]', 'E2E Test Org');
        await page.fill('input[name="admin_full_name"]', 'E2E Owner');
        await page.fill('input[name="admin_email"]', email);
        await page.fill('input[name="admin_password"]', 'password123');
        // Logo upload is optional; registration works without it
        await page.click('button:has-text("Create Account")');

        // Check for success message
        await expect(page.locator('text=Registration Successful')).toBeVisible({ timeout: 15000 });

        // Verify footer
        await expect(page.locator('text=Powered by OfficeFlow')).toBeVisible();

        // Wait for redirect to login
        await page.waitForURL(/.*login/, { timeout: 10000 });

        // Login with new credentials
        await page.fill('input[placeholder="Admin Email"]', email);
        await page.fill('input[placeholder="Password"]', 'password123');
        await page.click('button:has-text("Enter Dashboard")');

        await page.waitForURL(/.*dashboard/, { timeout: 10000 });
        await expect(page.locator('text=E2E Test Org')).toBeVisible();
    });

    test('Attendance Logs page loads without error', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Admin Email"]', 'admin@officeflow.ai');
        await page.fill('input[placeholder="Password"]', 'admin123');
        await page.click('button:has-text("Enter Dashboard")');
        await page.waitForURL(/.*dashboard/, { timeout: 10000 });
        await page.goto('/dashboard/logs');
        await expect(page.getByRole('heading', { name: /Attendance Audit Logs/ })).toBeVisible({ timeout: 10000 });
    });

    test('Owner can manage Sub-Admins', async ({ page }) => {
        // Login as the seed admin (owner role)
        await page.goto('/login');
        await page.fill('input[placeholder="Admin Email"]', 'admin@officeflow.ai');
        await page.fill('input[placeholder="Password"]', 'admin123');
        await page.click('button:has-text("Enter Dashboard")');

        // Navigate to Team Management
        await page.click('text=Team Management');
        await expect(page.locator('h1')).toContainText('Team Management');

        // Add a sub-admin
        await page.click('text=Add Sub-Admin');
        const subAdminEmail = `sub-${Date.now()}@test.com`;
        await page.fill('input[placeholder="Full Name"]', 'E2E SubAdmin');
        await page.fill('input[placeholder="Email Address"]', subAdminEmail);
        await page.fill('input[placeholder="Portal Password"]', 'password123');
        await page.click('button:has-text("Grant Access")');

        // Verify success message
        await expect(page.locator('text=Admin added successfully')).toBeVisible();

        // Verify sub-admin in list
        await expect(page.locator(`text=${subAdminEmail}`)).toBeVisible();
    });
});
