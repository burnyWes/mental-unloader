import { expect, test, type Page } from '@playwright/test'
import {
  prepareEmulators,
  settleWrites,
  storedDocumentIds,
} from './emulatorHousehold.ts'
import { pressButton } from './keyboard.ts'
import {
  createFolder,
  createList,
  exactButton,
  heading,
  openFolder,
  openFolders,
  signInAndOpenFolders,
} from './organizer.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

async function editList(page: Page, name: string) {
  await pressButton(page, name)
  await expect(heading(page, name)).toBeFocused()
  await pressButton(page, 'Liste bearbeiten')
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
}

test('keeps a created list after a reload', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')

  await createList(page, 'Haushalt')
  await settleWrites(page)
  await page.reload()
  await openFolders(page)

  await expect(exactButton(page, 'Familie, 1 Liste')).toBeVisible()
  await openFolder(page, 'Familie')
  await expect(exactButton(page, 'Haushalt')).toBeVisible()
})

test('shows a list created on another device without reloading', async ({
  browser,
}) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()
  const deviceA = await contextA.newPage()
  const deviceB = await contextB.newPage()
  await signInAndOpenFolders(deviceA)
  await createFolder(deviceA, 'Familie')
  await settleWrites(deviceA)
  await signInAndOpenFolders(deviceB)
  await openFolder(deviceB, 'Familie')
  await openFolder(deviceA, 'Familie')

  await createList(deviceA, 'Haushalt')

  await expect(exactButton(deviceB, 'Haushalt')).toBeVisible()
  await contextA.close()
  await contextB.close()
})

test('moves a list to another folder', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await createFolder(page, 'Garten')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')

  await editList(page, 'Haushalt')
  await page.getByLabel('Ordner', { exact: true }).selectOption('Garten')
  await pressButton(page, 'Speichern')
  await expect(heading(page, 'Haushalt')).toBeFocused()
  await settleWrites(page)
  await pressButton(page, 'Zurück')

  await expect(heading(page, 'Garten')).toBeFocused()
  await expect(exactButton(page, 'Haushalt')).toBeVisible()
})

test('deletes a list after confirming', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')

  await editList(page, 'Haushalt')
  await pressButton(page, 'Löschen')
  await expect(heading(page, 'Liste Haushalt löschen?')).toBeFocused()
  await pressButton(page, 'Löschen')

  await expect(heading(page, 'Familie')).toBeFocused()
  await expect(page.getByText('Noch keine Listen.')).toBeVisible()
})

test('deletes a folder together with its lists', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await createList(page, 'Wocheneinkauf')
  await settleWrites(page)
  expect(await storedDocumentIds('lists')).toHaveLength(2)

  await pressButton(page, 'Ordner bearbeiten')
  await pressButton(page, 'Löschen')
  await expect(
    heading(page, 'Ordner Familie mit 2 Listen löschen?'),
  ).toBeFocused()
  await pressButton(page, 'Löschen')
  await expect(heading(page, 'Ordner')).toBeFocused()
  await settleWrites(page)

  expect(await storedDocumentIds('lists')).toEqual([])
  expect(await storedDocumentIds('folders')).toEqual([])
})
