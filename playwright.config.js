import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e-tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5173', // Admin Vite dev server
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: [
        {
            command: 'cd admin && npm run dev',
            url: 'http://localhost:5173',
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'cd backend && venv\\Scripts\\activate && python main.py',
            url: 'http://localhost:8001/health',
            reuseExistingServer: !process.env.CI,
        }
    ],
});
