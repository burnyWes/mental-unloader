import { expect, test, type Page } from '@playwright/test'
import { addDays, spokenDayOf } from '../src/tasks/domain/calendarDay.ts'
import { prepareEmulators, settleWrites } from './emulatorHousehold.ts'
import { pressButton } from './keyboard.ts'
import {
  browserToday,
  createFolder,
  createList,
  createRecurringTask,
  exactButton,
  expectedInitialDeadline,
  heading,
  openFolder,
  openFolders,
  openList,
  recurringRowName,
  signInAndOpenFolders,
} from './organizer.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

async function openHousehold(page: Page) {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await openList(page, 'Haushalt')
}

async function reopenHousehold(page: Page) {
  await settleWrites(page)
  await page.reload()
  await openFolders(page)
  await openFolder(page, 'Familie')
  await openList(page, 'Haushalt')
}

test('keeps a recurring task after a reload', async ({ page }) => {
  await openHousehold(page)
  const today = await browserToday(page)
  const rowName = recurringRowName(
    'Müll rausbringen',
    spokenDayOf(expectedInitialDeadline(today), today),
    'monatlich',
  )

  await createRecurringTask(page, 'Müll rausbringen', 'monatlich')
  await expect(exactButton(page, rowName)).toBeFocused()
  await reopenHousehold(page)

  await pressButton(page, rowName)
  await expect(heading(page, 'Müll rausbringen')).toBeFocused()
  await expect(page.getByText('Wiederholung', { exact: true })).toBeVisible()
  await expect(page.getByText('monatlich', { exact: true })).toBeVisible()
})

test('moves the deadline when a recurring task is completed', async ({
  page,
}) => {
  await openHousehold(page)
  const today = await browserToday(page)
  const deadline = expectedInitialDeadline(today)
  const nextDeadline = addDays(deadline, 7)
  const rowName = recurringRowName(
    'Müll rausbringen',
    spokenDayOf(deadline, today),
    'wöchentlich',
  )
  const movedRowName = recurringRowName(
    'Müll rausbringen',
    spokenDayOf(nextDeadline, today),
    'wöchentlich',
  )
  await createRecurringTask(page, 'Müll rausbringen', 'wöchentlich')
  await expect(exactButton(page, rowName)).toBeFocused()

  await pressButton(page, 'Müll rausbringen erledigen')
  await expect(
    page.getByText(
      `Der nächste Stichtag ist der ${spokenDayOf(nextDeadline, today)}.`,
    ),
  ).toBeVisible()
  await pressButton(page, 'Erledigen')

  await expect(exactButton(page, movedRowName)).toBeVisible()
  await reopenHousehold(page)
  await expect(exactButton(page, 'erledigt (1)')).toBeVisible()
  await pressButton(page, movedRowName)
  await expect(heading(page, 'Müll rausbringen')).toBeFocused()
  await expect(page.getByText('Verlauf', { exact: true })).toBeVisible()
  await expect(page.getByText('1× erledigt', { exact: true })).toBeVisible()
})
