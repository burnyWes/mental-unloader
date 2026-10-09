import { expect, test, type Page } from '@playwright/test'
import { household, prepareEmulators } from './emulatorHousehold.ts'
import { pressButton, signIn, typeInto } from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

function heading(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name })
}

test('shows the urgent tasks after signing in', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await expect(heading(page, 'Dringend')).toBeVisible()
})

test('rejects a wrong password', async ({ page }) => {
  await page.goto('/')
  await typeInto(page, 'E-Mail', household.email)
  await typeInto(page, 'Passwort', 'falsch')
  await pressButton(page, 'Anmelden')

  await expect(
    page.getByText('E-Mail oder Passwort stimmt nicht.').first(),
  ).toBeVisible()
})

test('stays signed in after a reload', async ({ page }) => {
  await page.goto('/')
  await signIn(page)
  await expect(heading(page, 'Dringend')).toBeVisible()

  await page.reload()

  await expect(heading(page, 'Dringend')).toBeVisible()
})

test('signs out after confirming and stays signed out after a reload', async ({
  page,
}) => {
  await page.goto('/')
  await signIn(page)
  await expect(heading(page, 'Dringend')).toBeVisible()

  await pressButton(page, 'Einstellungen')
  await pressButton(page, 'Abmelden')
  await expect(heading(page, 'Abmelden?')).toBeVisible()
  await pressButton(page, 'Abmelden')

  await expect(heading(page, 'Mental Unloader')).toBeVisible()
  await page.reload()
  await expect(heading(page, 'Mental Unloader')).toBeVisible()
})
