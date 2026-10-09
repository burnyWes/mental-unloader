import { readFileSync } from 'node:fs'
import { firebaseConfig } from '../src/shared/auth/firebaseConfig.ts'

const PROJECT = firebaseConfig.projectId
const AUTH_EMULATOR = 'http://127.0.0.1:9099'

export const household = {
  email: 'haushalt@example.com',
  password: 'nur-im-emulator',
}

function householdUid(): string {
  const rules = readFileSync('firestore.rules', 'utf8')
  const match = rules.match(/request\.auth\.uid == '([^']+)'/)
  if (!match) throw new Error('firestore.rules names no household uid')
  return match[1]
}

async function callEmulator(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`${method} ${url} failed: ${await response.text()}`)
  }
}

export async function prepareEmulators(): Promise<void> {
  await callEmulator(
    `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT}/accounts`,
    'DELETE',
  )
  await callEmulator(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts`,
    'POST',
    {
      localId: householdUid(),
      email: household.email,
      password: household.password,
      emailVerified: true,
    },
  )
}
