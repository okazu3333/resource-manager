import { test, expect } from '@playwright/test'

test.describe('タイマー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    // 既存タイマーが動いていれば停止
    const stopBtn = page.getByRole('button', { name: '停止して記録' })
    if (await stopBtn.isVisible()) {
      await stopBtn.click()
      await page.getByRole('combobox').first().selectOption({ index: 1 })
      await page.getByRole('button', { name: '記録する' }).click()
      await page.waitForTimeout(1000)
    }
  })

  test('タイマー開始・停止・記録ができる', async ({ page }) => {
    // タイマー開始
    await page.getByRole('button', { name: '開始' }).click()
    await expect(page.getByRole('button', { name: '停止して記録' })).toBeVisible({ timeout: 5000 })

    // 2秒待ってから停止
    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: '停止して記録' }).click()

    // 記録ダイアログが開く
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('稼働を記録')).toBeVisible()

    // 計測時間が表示されている
    await expect(page.getByText('計測時間')).toBeVisible()
    await expect(page.getByText('記録時間（15分単位切上げ）')).toBeVisible()

    // 稼働分類を選択
    await page.getByRole('combobox', { name: /稼働分類/ }).click()
    await page.getByRole('option', { name: '生産稼働（開発）' }).click()

    // 作業内容入力
    await page.getByPlaceholder('作業内容を入力（任意）').fill('Playwrightテスト')

    // 記録
    await page.getByRole('button', { name: '記録する' }).click()
    await expect(page.getByText('稼働を記録しました')).toBeVisible({ timeout: 10000 })

    // ダイアログが閉じてタイマーリセット
    await expect(page.getByRole('button', { name: '開始' })).toBeVisible()
  })
})
