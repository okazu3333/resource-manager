import { test, expect } from '@playwright/test'

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('必須要素が表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
    await expect(page.getByText('本日の稼働')).toBeVisible()
    await expect(page.getByText('今週の稼働')).toBeVisible()
  })

  test('タイマーウィジェットが表示される', async ({ page }) => {
    // タイマー表示(00:00:00 or 動作中)
    await expect(page.locator('.font-mono').first()).toBeVisible()
  })

  test('サイドバーナビゲーションが機能する', async ({ page }) => {
    await page.getByRole('link', { name: '稼働記録' }).click()
    await expect(page).toHaveURL(/\/time/)

    await page.getByRole('link', { name: '案件' }).click()
    await expect(page).toHaveURL(/\/projects/)

    await page.getByRole('link', { name: 'レポート' }).click()
    await expect(page).toHaveURL(/\/reports/)

    await page.getByRole('link', { name: 'ダッシュボード' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
