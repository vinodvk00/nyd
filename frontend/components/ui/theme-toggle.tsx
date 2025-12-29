"use client"

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCallback, useEffect, useState } from 'react'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    const css = `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }

      ::view-transition-old(root) {
        z-index: 1;
      }

      ::view-transition-new(root) {
        z-index: 9999;
        animation: circle-reveal 0.4s ease-out;
      }

      @keyframes circle-reveal {
        from { clip-path: circle(0% at 100% 0%); }
        to { clip-path: circle(150% at 100% 0%); }
      }
    `

    let style = document.getElementById('theme-transition')
    if (!style) {
      style = document.createElement('style')
      style.id = 'theme-transition'
      document.head.appendChild(style)
    }
    style.textContent = css

    if (!document.startViewTransition) {
      setTheme(newTheme)
      return
    }

    document.startViewTransition(() => setTheme(newTheme))
  }, [resolvedTheme, setTheme])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
