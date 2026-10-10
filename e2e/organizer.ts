import { expect, type Page } from '@playwright/test'
import { pressButton, signIn, typeInto } from './keyboard.ts'

export function heading(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name })
}

export function exactButton(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true })
}

export function folderButton(page: Page, name: string) {
  return page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) })
}

export async function openFolders(page: Page) {
  await pressButton(page, 'Ordner')
  await expect(heading(page, 'Ordner')).toBeVisible()
}

export async function signInAndOpenFolders(page: Page) {
  await page.goto('/')
  await signIn(page)
  await expect(heading(page, 'Dringend')).toBeVisible()
  await openFolders(page)
}

export async function createFolder(page: Page, name: string) {
  await pressButton(page, 'Ordner anlegen')
  await typeInto(page, 'Name', name)
  await pressButton(page, 'Speichern')
  await expect(exactButton(page, name)).toBeFocused()
}

export async function openFolder(page: Page, name: string) {
  await folderButton(page, name).focus()
  await page.keyboard.press('Enter')
  await expect(heading(page, name)).toBeFocused()
}

export async function createList(page: Page, name: string) {
  await pressButton(page, 'Liste anlegen')
  await typeInto(page, 'Name', name)
  await pressButton(page, 'Speichern')
  await expect(exactButton(page, name)).toBeFocused()
}

export async function openList(page: Page, name: string) {
  await folderButton(page, name).focus()
  await page.keyboard.press('Enter')
  await expect(heading(page, name)).toBeFocused()
}

export function taskRowName(name: string, { urgent = false } = {}) {
  return urgent ? `${name}, dringend` : name
}

export async function createTask(
  page: Page,
  name: string,
  { urgent = false } = {},
) {
  await pressButton(page, 'Aufgabe anlegen')
  await typeInto(page, 'Name', name)
  if (urgent) {
    await page.getByRole('radio', { name: 'Dringend' }).focus()
    await page.keyboard.press('Space')
  }
  await pressButton(page, 'Speichern')
  await expect(exactButton(page, taskRowName(name, { urgent }))).toBeFocused()
}
