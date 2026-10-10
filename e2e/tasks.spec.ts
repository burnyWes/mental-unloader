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
  createTask,
  exactButton,
  folderButton,
  heading,
  openFolder,
  openFolders,
  openList,
  signInAndOpenFolders,
  taskRowName,
} from './organizer.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

test('keeps a created task after a reload', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await openList(page, 'Haushalt')

  await createTask(page, 'Müll rausbringen', { urgent: true })
  await settleWrites(page)
  await page.reload()
  await openFolders(page)
  await openFolder(page, 'Familie')

  await expect(exactButton(page, 'Haushalt, 1 offen, 1 dringend')).toBeVisible()
  await openList(page, 'Haushalt')
  await expect(
    exactButton(page, taskRowName('Müll rausbringen', { urgent: true })),
  ).toBeVisible()
})

test('shows a task created on another device without reloading', async ({
  browser,
}) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()
  const deviceA = await contextA.newPage()
  const deviceB = await contextB.newPage()
  await signInAndOpenFolders(deviceA)
  await createFolder(deviceA, 'Familie')
  await openFolder(deviceA, 'Familie')
  await createList(deviceA, 'Haushalt')
  await settleWrites(deviceA)
  await signInAndOpenFolders(deviceB)
  await openFolder(deviceB, 'Familie')
  await openList(deviceB, 'Haushalt')
  await openList(deviceA, 'Haushalt')

  await createTask(deviceA, 'Keller aufräumen')

  await expect(exactButton(deviceB, 'Keller aufräumen')).toBeVisible()
  await contextA.close()
  await contextB.close()
})

test('deletes a folder together with its lists and tasks', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await openList(page, 'Haushalt')
  await createTask(page, 'Müll rausbringen', { urgent: true })
  await createTask(page, 'Keller aufräumen')
  await settleWrites(page)
  expect(await storedDocumentIds('tasks')).toHaveLength(2)

  await pressButton(page, 'Zurück')
  await pressButton(page, 'Ordner bearbeiten')
  await pressButton(page, 'Löschen')
  await expect(
    heading(page, 'Ordner Familie mit 1 Liste und 2 Aufgaben löschen?'),
  ).toBeFocused()
  await pressButton(page, 'Löschen')
  await expect(heading(page, 'Ordner')).toBeFocused()
  await settleWrites(page)

  expect(await storedDocumentIds('tasks')).toEqual([])
  expect(await storedDocumentIds('lists')).toEqual([])
  expect(await storedDocumentIds('folders')).toEqual([])
})

test('moves a task to a list of another folder', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await createFolder(page, 'Garten')
  await openFolder(page, 'Garten')
  await createList(page, 'Beete')
  await pressButton(page, 'Zurück')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await openList(page, 'Haushalt')
  await createTask(page, 'Müll rausbringen')

  await pressButton(page, 'Müll rausbringen')
  await expect(heading(page, 'Müll rausbringen')).toBeFocused()
  await pressButton(page, 'Bearbeiten')
  await page.getByLabel('Liste', { exact: true }).selectOption('Beete')
  await pressButton(page, 'Speichern')
  await expect(heading(page, 'Müll rausbringen')).toBeFocused()
  await settleWrites(page)
  await pressButton(page, 'Zurück')

  await expect(heading(page, 'Beete')).toBeVisible()
  await expect(exactButton(page, 'Müll rausbringen')).toBeFocused()
})

async function openTaskList(page: Page) {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await openList(page, 'Haushalt')
}

test('completes a task and reopens it', async ({ page }) => {
  await openTaskList(page)
  await createTask(page, 'Müll rausbringen')

  await pressButton(page, 'Müll rausbringen erledigen')
  await expect(heading(page, 'Müll rausbringen erledigen?')).toBeFocused()
  await pressButton(page, 'Erledigen')
  await expect(page.getByText('Keine offenen Aufgaben.')).toBeVisible()

  await pressButton(page, 'erledigt (1)')
  await folderButton(page, 'Müll rausbringen').focus()
  await page.keyboard.press('Enter')
  await expect(heading(page, 'Müll rausbringen')).toBeFocused()
  await pressButton(page, 'Wieder öffnen')
  await expect(exactButton(page, 'Erledigen')).toBeFocused()
  await pressButton(page, 'Zurück')
  await expect(exactButton(page, 'offen (1)')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(exactButton(page, 'Müll rausbringen')).toBeFocused()

  await settleWrites(page)
  await page.reload()
  await openFolders(page)
  await openFolder(page, 'Familie')
  await openList(page, 'Haushalt')
  await expect(exactButton(page, 'Müll rausbringen')).toBeVisible()
})

test('deletes a task after confirming', async ({ page }) => {
  await openTaskList(page)
  await createTask(page, 'Müll rausbringen')

  await pressButton(page, 'Müll rausbringen')
  await pressButton(page, 'Löschen')
  await expect(heading(page, 'Aufgabe Müll rausbringen löschen?')).toBeFocused()
  await pressButton(page, 'Löschen')

  await expect(heading(page, 'Haushalt')).toBeFocused()
  await expect(page.getByText('Noch keine Aufgaben.')).toBeVisible()
  await settleWrites(page)
  expect(await storedDocumentIds('tasks')).toEqual([])
})
