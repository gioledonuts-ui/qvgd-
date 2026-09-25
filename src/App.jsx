import { useState } from 'react'
import ModeratorDashboard from './components/ModeratorDashboard'
import LiveOverlay from './components/LiveOverlay'
import PinGate from './components/PinGate'

/**
 * Routage minimal :
 * - `/`             → console modérateur (protégée par PIN)
 * - `/?view=overlay` → overlay public du live (source navigateur OBS)
 */
export default function App() {
  const params = new URLSearchParams(window.location.search)
  const isOverlay = params.get('view') === 'overlay'

  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('studio-pin-ok') === '1',
  )

  if (isOverlay) return <LiveOverlay />
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />
  return <ModeratorDashboard />
}
