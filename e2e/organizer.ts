import { expect, type Page } from '@playwright/test'
import {
  addDays,
  calendarDayOf,
  stepYear,
  type CalendarDay,
} from '../src/tasks/domain/calendarDay.ts'
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

export async function openUrgent(page: Page, buttonName = 'Dringend') {
  await pressButton(page, buttonName)
  await expect(heading(page, 'Dringend')).toBeFocused()
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

export function urgentRowName(
  name: string,
  folderName: string,
  listName: string,
) {
  return `${name}, dringend, ${folderName}, ${listName}`
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

export function deadlineRowName(name: string, spokenDay: string) {
  return `${name}, Stichtag ${spokenDay}`
}

export async function browserToday(page: Page): Promise<CalendarDay> {
  return calendarDayOf(new Date(await page.evaluate(() => Date.now())))
}

export function expectedInitialDeadline(today: CalendarDay): CalendarDay {
  return stepYear(addDays(today, 7), 1)
}

export async function createDeadlineTask(page: Page, name: string) {
  await pressButton(page, 'Aufgabe anlegen')
  await typeInto(page, 'Name', name)
  await page.getByRole('radio', { name: 'Stichtag' }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('spinbutton', { name: 'Jahr' }).focus()
  await page.keyboard.press('ArrowUp')
  await pressButton(page, 'Speichern')
}

export function recurringRowName(
  name: string,
  spokenDay: string,
  rhythmLabel: string,
) {
  return `${deadlineRowName(name, spokenDay)}, ${rhythmLabel}`
}

export async function createRecurringTask(
  page: Page,
  name: string,
  rhythmLabel: string,
) {
  await pressButton(page, 'Aufgabe anlegen')
  await typeInto(page, 'Name', name)
  await page.getByRole('radio', { name: 'Stichtag' }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('spinbutton', { name: 'Jahr' }).focus()
  await page.keyboard.press('ArrowUp')
  await page.getByRole('checkbox', { name: 'Wiederkehrend' }).focus()
  await page.keyboard.press('Space')
  await page.getByLabel('Rhythmus', { exact: true }).selectOption(rhythmLabel)
  await pressButton(page, 'Speichern')
}
