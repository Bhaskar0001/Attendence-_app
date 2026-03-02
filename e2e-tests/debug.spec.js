import { test, expect } from '@playwright/test';

test('Debug admin login', async ({ page }) => {
    const requests = [];
    const responses = [];
    const consoleLogs = [];

    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    page.on('request', req => {
        requests.push(`${req.method()} ${req.url()}`);
    });

    page.on('response', async res => {
        let body = '';
        try { body = await res.text(); } catch (e) { }
        responses.push(`${res.status()} ${res.url()} | ${body.substring(0, 200)}`);
    });

    await page.goto('/login');
    await page.fill('input[placeholder="Admin Email"]', 'admin@officeflow.ai');
    await page.fill('input[placeholder="Password"]', 'admin123');
    await page.click('button:has-text("Enter Dashboard")');

    await page.waitForTimeout(5000);

    console.log('=== ALL REQUESTS ===');
    requests.forEach(r => console.log(r));
    console.log('=== ALL RESPONSES ===');
    responses.forEach(r => console.log(r));
    console.log('=== CONSOLE LOGS ===');
    consoleLogs.forEach(r => console.log(r));
    console.log('=== CURRENT URL ===');
    console.log(page.url());

    expect(true).toBe(true);
});
