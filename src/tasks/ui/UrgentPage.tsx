import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'

type UrgentPageProps = {
  navigation: ReactNode
}

export function UrgentPage({ navigation }: UrgentPageProps) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Dringend
          </h1>
        </div>
        <p>Nichts Dringendes.</p>
      </main>
    </>
  )
}
