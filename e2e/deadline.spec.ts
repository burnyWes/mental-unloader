import { expect, test, type Page } from '@playwright/test'
import {
  addDays,
  fullDayOf,
  spokenDayOf,
  stepYear,
} from '../src/tasks/domain/calendarDay.ts'
import { prepareEmulators, settleWrites } from './emulatorHousehold.ts'
import { pressButton } from './keyboard.ts'
import {
  browserToday,
  createDeadlineTask,
  createFolder,
  createList,
  deadlineRowName,
  exactButton,
  expectedInitialDeadline,
  heading,
  openFolder,
  openFolders,
  openList,
  signInAndOpenFolders,
} from './organizer.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

test('keeps a created deadline task after a reload', async ({ page }) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await openList(page, 'Haushalt')
  const today = await browserToday(page)
  const deadline = expectedInitialDeadline(today)
  const rowName = deadlineRowName(
    'Reifen wechseln',
    spokenDayOf(deadline, today),
  )

  await createDeadlineTask(page, 'Reifen wechseln')

  await expect(exactButton(page, rowName)).toBeFocused()
  await settleWrites(page)
  await page.reload()
  await openFolders(page)
  await openFolder(page, 'Familie')
  await openList(page, 'Haushalt')
  await expect(exactButton(page, rowName)).toBeVisible()
  await pressButton(page, rowName)
  await expect(heading(page, 'Reifen wechseln')).toBeFocused()
  await expect(
    page.getByText(`Stichtag ${fullDayOf(deadline)}`, { exact: true }),
  ).toBeVisible()
})

async function openHousehold(page: Page) {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await openList(page, 'Haushalt')
}

async function createAndEditDeadlineTask(page: Page, rowName: string) {
  await createDeadlineTask(page, 'Reifen wechseln')
  await expect(exactButton(page, rowName)).toBeFocused()
  await pressButton(page, rowName)
  await expect(heading(page, 'Reifen wechseln')).toBeFocused()
  await pressButton(page, 'Bearbeiten')
}

test('makes a deadline task urgent immediately', async ({ page }) => {
  await openHousehold(page)
  const today = await browserToday(page)
  const spokenDeadline = spokenDayOf(expectedInitialDeadline(today), today)
  await createAndEditDeadlineTask(
    page,
    deadlineRowName('Reifen wechseln', spokenDeadline),
  )

  await page.getByLabel('Dringend ab', { exact: true }).selectOption('sofort')
  await pressButton(page, 'Speichern')
  await expect(heading(page, 'Reifen wechseln')).toBeFocused()
  await pressButton(page, 'Zurück')

  await expect(
    exactButton(
      page,
      `${deadlineRowName('Reifen wechseln', spokenDeadline)}, dringend`,
    ),
  ).toBeFocused()
  await pressButton(page, 'Zurück')
  await expect(exactButton(page, 'Haushalt, 1 offen, 1 dringend')).toBeVisible()
})

test('shows a deadline in a past year as overdue', async ({ page }) => {
  await openHousehold(page)
  const today = await browserToday(page)
  await createAndEditDeadlineTask(
    page,
    deadlineRowName(
      'Reifen wechseln',
      spokenDayOf(expectedInitialDeadline(today), today),
    ),
  )

  await page.getByRole('spinbutton', { name: 'Jahr' }).focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await pressButton(page, 'Speichern')
  await expect(heading(page, 'Reifen wechseln')).toBeFocused()
  await pressButton(page, 'Zurück')

  const pastDeadline = stepYear(addDays(today, 7), -1)
  await expect(
    exactButton(
      page,
      `Reifen wechseln, überfällig seit ${spokenDayOf(pastDeadline, today)}`,
    ),
  ).toBeFocused()
})
