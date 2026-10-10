import { expect, test, type Page } from '@playwright/test'
import { prepareEmulators, settleWrites } from './emulatorHousehold.ts'
import { pressButton } from './keyboard.ts'
import {
  createFolder,
  exactButton,
  heading,
  openFolder,
  openFolders,
  signInAndOpenFolders,
} from './organizer.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

async function editFolder(page: Page, name: string) {
  await openFolder(page, name)
  await pressButton(page, 'Ordner bearbeiten')
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
}

test('keeps a created folder after a reload', async ({ page }) => {
  await signInAndOpenFolders(page)

  await createFolder(page, 'Familie')
  await settleWrites(page)
  await page.reload()
  await openFolders(page)

  await expect(exactButton(page, 'Familie')).toBeVisible()
})

test('shows a folder created on another device without reloading', async ({
  browser,
}) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()
  const deviceA = await contextA.newPage()
  const deviceB = await contextB.newPage()
  await signInAndOpenFolders(deviceA)
  await signInAndOpenFolders(deviceB)

  await createFolder(deviceA, 'Familie')

  await expect(exactButton(deviceB, 'Familie')).toBeVisible()
  await contextA.close()
  await contextB.close()
})

test('renames a folder', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')

  await editFolder(page, 'Familie')
  await page.keyboard.press('Control+A')
  await page.keyboard.type('Haushalt')
  await pressButton(page, 'Speichern')

  await expect(heading(page, 'Haushalt')).toBeFocused()
  await pressButton(page, 'Zurück')
  await expect(exactButton(page, 'Haushalt')).toBeVisible()
})

test('deletes a folder after confirming', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')

  await editFolder(page, 'Familie')
  await pressButton(page, 'Löschen')
  await expect(heading(page, 'Ordner Familie löschen?')).toBeFocused()
  await pressButton(page, 'Löschen')

  await expect(heading(page, 'Ordner')).toBeFocused()
  await expect(page.getByText('Noch keine Ordner.')).toBeVisible()
})
