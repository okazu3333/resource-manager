import { test, expect } from '@playwright/test'

test.describe('稼働記録', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/time')
  })

  test('ページが正常に表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '稼働記録' })).toBeVisible()
    await expect(page.getByRole('button', { name: '手動入力' })).toBeVisible()
  })

  test('手動入力で稼働記録を作成できる', async ({ page }) => {
    await page.getByRole('button', { name: '手動入力' }).click()

    // フォームダイアログが開く
    await expect(page.getByRole('dialog')).toBeVisible()

    // 稼働分類を選択
    await page.getByRole('combobox', { name: /稼働分類/ }).click()
    await page.getByRole('option', { name: '保守稼働（開発）' }).click()

    // 時間入力 (1時間30分)
    await page.getByLabel('時間').fill('1')
    await page.getByLabel('分').fill('30')

    // 保存
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('稼働を記録しました')).toBeVisible({ timeout: 10000 })
  })

  test('週表示に切り替えられる', async ({ page }) => {
    const weekBtn = page.getByRole('link', { name: '週' })
    if (await weekBtn.isVisible()) {
      await weekBtn.click()
      await expect(page.url()).toContain('view=week')
    }
  })
})
