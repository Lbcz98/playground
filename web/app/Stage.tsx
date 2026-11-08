'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { isTvMode } from './tv'

/**
 * The 1280×720 TV frame, scaled to fit the window. The screen inside is built at its real size.
 * TV mode fits the width only: the viewport is 1280px wide there, so the frame draws at scale 1, and a URL bar
 * may cover its bottom until the first key press goes fullscreen.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const tv = isTvMode()
    const fit = () => setScale(tv ? window.innerWidth / 1280 : Math.min(window.innerWidth / 1280, window.innerHeight / 720))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  )
}
