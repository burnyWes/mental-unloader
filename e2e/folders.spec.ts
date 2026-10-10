import { expect, test, type Page } from '@playwright/test'
import { prepareEmulators, settleWrites } from './emulatorHousehold.ts'
import { pressButton, signIn, typeInto } from './keyboard.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

function heading(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name })
}

function folderButton(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true })
}

async function openFolders(page: Page) {
  await pressButton(page, 'Ordner')
  await expect(heading(page, 'Ordner')).toBeVisible()
}

async function signInAndOpenFolders(page: Page) {
  await page.goto('/')
  await signIn(page)
  await expect(heading(page, 'Dringend')).toBeVisible()
  await openFolders(page)
}

async function createFolder(page: Page, name: string) {
  await pressButton(page, 'Ordner anlegen')
  await typeInto(page, 'Name', name)
  await pressButton(page, 'Speichern')
  await expect(folderButton(page, name)).toBeFocused()
}

async function editFolder(page: Page, name: string) {
  await pressButton(page, name)
  await expect(heading(page, name)).toBeFocused()
  await pressButton(page, 'Ordner bearbeiten')
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
}

test('keeps a created folder after a reload', async ({ page }) => {
  await signInAndOpenFolders(page)

  await createFolder(page, 'Familie')
  await settleWrites(page)
  await page.reload()
  await openFolders(page)

  await expect(folderButton(page, 'Familie')).toBeVisible()
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

  await expect(folderButton(deviceB, 'Familie')).toBeVisible()
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
  await expect(folderButton(page, 'Haushalt')).toBeVisible()
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
