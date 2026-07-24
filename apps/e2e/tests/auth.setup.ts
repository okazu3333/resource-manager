import { test as setup, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const authFile = 'playwright/.auth/user.json'

setup('ログイン状態を保存', async ({ page }) => {
  // auth ディレクトリを作成
  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  if (!email || !password) {
    throw new Error('.env.test に E2E_EMAIL と E2E_PASSWORD を設定してください')
  }

  await page.goto('/login')
  await expect(page.getByLabel('メールアドレス')).toBeVisible()

  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()

  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()

  await page.context().storageState({ path: authFile })
})
