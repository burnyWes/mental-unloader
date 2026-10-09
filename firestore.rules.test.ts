import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const rules = readFileSync('firestore.rules', 'utf8')

function householdUidFrom(securityRules: string): string {
  const match = securityRules.match(/request\.auth\.uid == '([^']+)'/)
  if (!match) throw new Error('firestore.rules names no household uid')
  return match[1]
}

const householdUid = householdUidFrom(rules)
const strangerUid = `${householdUid}-someone-else`

let testEnvironment: RulesTestEnvironment

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: 'demo-mental-unloader',
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  })
})

afterAll(async () => {
  await testEnvironment.cleanup()
})

beforeEach(async () => {
  await testEnvironment.clearFirestore()
})

function documentOf(collectionName: string, uid: string | null) {
  const context =
    uid === null
      ? testEnvironment.unauthenticatedContext()
      : testEnvironment.authenticatedContext(uid)
  return doc(context.firestore(), collectionName, 'probe')
}

const probe = { name: 'Probe' }

describe.each(['folders', 'lists', 'tasks'])(
  'firestore security rules for %s',
  (collectionName) => {
    it('lets the household write, read and delete', async () => {
      await assertSucceeds(
        setDoc(documentOf(collectionName, householdUid), probe),
      )
      await assertSucceeds(getDoc(documentOf(collectionName, householdUid)))
      await assertSucceeds(deleteDoc(documentOf(collectionName, householdUid)))
    })

    it('refuses another account', async () => {
      await assertFails(getDoc(documentOf(collectionName, strangerUid)))
      await assertFails(setDoc(documentOf(collectionName, strangerUid), probe))
    })

    it('refuses an unauthenticated visitor', async () => {
      await assertFails(getDoc(documentOf(collectionName, null)))
      await assertFails(setDoc(documentOf(collectionName, null), probe))
    })
  },
)

describe('firestore security rules outside the released collections', () => {
  it('refuses the household', async () => {
    const context = testEnvironment.authenticatedContext(householdUid)

    await assertFails(
      setDoc(doc(context.firestore(), 'households', 'ours'), { name: 'Wir' }),
    )
  })
})
