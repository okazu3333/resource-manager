import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,   // 同一ユーザーのデータを共有するため直列実行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  },

  projects: [
    // Step 1: ログイン済み状態を保存
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Step 2: 保存した状態でテスト実行
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // ローカル実行時のみ dev サーバーを起動
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'pnpm --filter web dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        cwd: path.resolve(__dirname, '../..'),
      },
})
