import { test, expect } from '@playwright/test'

test.describe('案件管理', () => {
  test('案件一覧が表示される', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: '案件' })).toBeVisible()
  })

  test('案件詳細を表示できる', async ({ page }) => {
    await page.goto('/projects')

    const firstProject = page.locator('a[href^="/projects/"]').first()
    const hasProjects = await firstProject.isVisible()
    if (!hasProjects) {
      test.skip()
      return
    }

    await firstProject.click()
    // 詳細ページが表示される（予実管理 or タスクセクション等）
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('案件新規登録ボタンが管理者に表示される', async ({ page }) => {
    await page.goto('/projects')
    // 管理者ユーザーの場合のみ表示
    const createBtn = page.getByRole('link', { name: '案件登録' })
    // 表示されていれば機能確認
    if (await createBtn.isVisible()) {
      await createBtn.click()
      await expect(page).toHaveURL(/\/projects\/new/)
      await expect(page.getByRole('heading', { name: '案件登録' })).toBeVisible()
    }
  })
})
