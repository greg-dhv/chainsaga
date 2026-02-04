'use client'

import { useEffect } from 'react'

interface UniverseThemeProps {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily?: string | null
  googleFontUrl?: string | null
  backgroundImageUrl?: string | null
  fontStyle: 'mono' | 'sans' | 'serif'
  children: React.ReactNode
}

export function UniverseTheme({
  primaryColor,
  secondaryColor,
  accentColor,
  fontFamily,
  googleFontUrl,
  backgroundImageUrl,
  fontStyle,
  children,
}: UniverseThemeProps) {
  // Load Google Font if specified
  useEffect(() => {
    if (googleFontUrl) {
      const linkId = 'universe-google-font'
      let link = document.getElementById(linkId) as HTMLLinkElement | null

      if (!link) {
        link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }

      link.href = googleFontUrl
    }
  }, [googleFontUrl])

  const fontClass = fontStyle === 'mono' ? 'font-mono' : fontStyle === 'serif' ? 'font-serif' : 'font-sans'

  return (
    <div
      className={`universe-theme min-h-screen ${fontClass}`}
      style={{
        '--universe-primary': primaryColor,
        '--universe-secondary': secondaryColor,
        '--universe-accent': accentColor,
        '--universe-primary-10': `${primaryColor}1a`,
        '--universe-primary-20': `${primaryColor}33`,
        '--universe-primary-40': `${primaryColor}66`,
        '--universe-primary-60': `${primaryColor}99`,
        backgroundColor: secondaryColor,
        fontFamily: fontFamily ? `"${fontFamily}", var(--font-${fontStyle})` : undefined,
      } as React.CSSProperties}
    >
      {/* Subtle background image overlay */}
      {backgroundImageUrl && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            opacity: 0.15,
            mixBlendMode: 'luminosity',
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Utility component for themed text
export function ThemedText({
  children,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'muted'
  className?: string
}) {
  const colorVar = variant === 'primary'
    ? 'var(--universe-primary)'
    : variant === 'secondary'
    ? 'var(--universe-accent)'
    : 'var(--universe-primary-60)'

  return (
    <span className={className} style={{ color: colorVar }}>
      {children}
    </span>
  )
}

// Utility component for themed borders
export function ThemedBorder({
  children,
  className = '',
  opacity = 20,
}: {
  children: React.ReactNode
  className?: string
  opacity?: 10 | 20 | 40 | 60
}) {
  const borderVar = `var(--universe-primary-${opacity})`

  return (
    <div className={className} style={{ borderColor: borderVar }}>
      {children}
    </div>
  )
}
