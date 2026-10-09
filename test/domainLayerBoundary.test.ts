import { ESLint } from 'eslint'
import { describe, expect, it, vi } from 'vitest'

const ESLINT_CONFIGURATION_COLD_START = 30_000

vi.setConfig({ testTimeout: ESLINT_CONFIGURATION_COLD_START })

const domainFilePath = 'src/tasks/domain/boundaryProbe.ts'
const uiFilePath = 'src/tasks/ui/boundaryProbe.ts'
const apiFilePath = 'src/tasks/api/boundaryProbe.ts'
const sharedDomainFilePath = 'src/shared/domain/boundaryProbe.ts'
const sharedUiFilePath = 'src/shared/ui/boundaryProbe.ts'

async function brokenRulesFor(source: string, filePath: string) {
  const [result] = await new ESLint().lintText(source, { filePath })
  return result.messages.map((message) => message.ruleId)
}

function importOf(module: string) {
  return `import { probe } from '${module}'\nexport const reexported = probe\n`
}

describe('domain layer boundary', () => {
  it('rejects a framework import inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      `import { useState } from 'react'\nexport const probe = useState\n`,
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a firebase import inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      `import { getFirestore } from 'firebase/firestore'\nexport const probe = getFirestore\n`,
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects reaching into the api from domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../api/tasksClient'),
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects the shared user interface inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shared/ui/announcement'),
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a shared module other than the shared domain inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shared/appearance/appearanceClient'),
      domainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('allows the shared domain inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shared/domain/clock'),
      domainFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })

  it('allows a framework import outside domain', async () => {
    const brokenRules = await brokenRulesFor(
      `import { useState } from 'react'\nexport const probe = useState\n`,
      uiFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })

  it('allows the shared user interface inside the user interface', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shared/ui/useHeadingFocus'),
      uiFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })
})

describe('api layer boundary', () => {
  it('rejects the user interface inside api', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../ui/useTasks'),
      apiFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('allows the domain inside api', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../domain/task'),
      apiFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })
})

describe('bounded context boundary', () => {
  it('rejects a context inside the shared user interface', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../tasks/ui/UrgentPage'),
      sharedUiFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a context inside the shared domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../tasks/domain/task'),
      sharedDomainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })
})
