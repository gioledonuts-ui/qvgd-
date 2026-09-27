import { useState } from 'react'
import { BRAND } from './brand'
import ModeratorDashboard from './components/ModeratorDashboard'
import LiveOverlay from './components/LiveOverlay'
import PinGate from './components/PinGate'

/**
 * Routage :
 * - `/`         → console modérateur (protégée par PIN)
 * - `/overlay`  → overlay public du live (source navigateur OBS)
 *   Options : ?transparent=1 (fond transparent pour OBS)
 *             &layout=lower  (bandeau bas compact au lieu du plein écran)
 * - `?view=overlay` reste supporté (compatibilité).
 */
function isOverlayRoute() {
  const path = window.location.pathname.replace(/\/+$/, '')
  const params = new URLSearchParams(window.location.search)
  return path === '/overlay' || params.get('view') === 'overlay'
}

export default function App() {
  const [isOverlay] = useState(isOverlayRoute)
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('studio-pin-ok') === '1',
  )

  if (isOverlay) {
    document.title = `${BRAND.name} — Overlay Live`
    return <LiveOverlay />
  }
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />
  return <ModeratorDashboard />
}
