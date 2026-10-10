import { expect, test } from '@playwright/test'
import { prepareEmulators } from './emulatorHousehold.ts'
import { pressButton } from './keyboard.ts'
import {
  createFolder,
  createList,
  createTask,
  exactButton,
  heading,
  openFolder,
  openFolders,
  openList,
  openUrgent,
  signInAndOpenFolders,
  urgentRowName,
} from './organizer.ts'

test.beforeEach(async () => {
  await prepareEmulators()
})

test('completes an urgent task on the urgent page and in its list', async ({
  page,
}) => {
  await signInAndOpenFolders(page)
  await createFolder(page, 'Familie')
  await openFolder(page, 'Familie')
  await createList(page, 'Haushalt')
  await openList(page, 'Haushalt')
  await createTask(page, 'Müll rausbringen', { urgent: true })

  await openUrgent(page, 'Dringend, 1 Aufgabe')
  await expect(
    exactButton(page, urgentRowName('Müll rausbringen', 'Familie', 'Haushalt')),
  ).toBeVisible()

  await pressButton(page, 'Müll rausbringen erledigen')
  await pressButton(page, 'Erledigen')
  await expect(heading(page, 'Dringend')).toBeFocused()
  await expect(page.getByText('Nichts Dringendes.')).toBeVisible()
  await expect(exactButton(page, 'Dringend')).toBeVisible()

  await openFolders(page)
  await openFolder(page, 'Familie')
  await openList(page, 'Haushalt')
  await pressButton(page, 'erledigt (1)')
  await expect(
    page.getByRole('button', { name: /^Müll rausbringen, erledigt/ }),
  ).toBeVisible()
})
