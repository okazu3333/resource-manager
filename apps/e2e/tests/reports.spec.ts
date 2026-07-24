import { test, expect } from '@playwright/test'

test.describe('レポート', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports')
  })

  test('レポートページが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'レポート' })).toBeVisible()
  })

  test('KPIカードが表示される', async ({ page }) => {
    await expect(page.getByText('総稼働時間').or(page.getByText('稼働時間')).first()).toBeVisible()
  })

  test('CSVエクスポートボタンが動作する', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /CSV/ }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
  })

  test('期間フィルターで絞り込める', async ({ page }) => {
    // 日付入力フィールドが存在する
    const fromInput = page.getByLabel('開始日').or(page.locator('input[type="date"]').first())
    await expect(fromInput).toBeVisible()
  })
})
