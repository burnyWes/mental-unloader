import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'

type FoldersPageProps = {
  navigation: ReactNode
}

export function FoldersPage({ navigation }: FoldersPageProps) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Ordner
          </h1>
        </div>
        <p>Noch keine Ordner.</p>
      </main>
    </>
  )
}
