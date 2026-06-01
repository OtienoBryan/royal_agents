import { useState, useEffect, useRef } from 'react'

interface UseInactivityOptions {
  timeout?: number // in milliseconds
  onInactive?: () => void
  onActive?: () => void
}

export const useInactivity = (options: UseInactivityOptions = {}) => {
  const { timeout = 60000, onInactive, onActive } = options
  const [isInactive, setIsInactive] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInactiveRef = useRef(false)
  const onInactiveRef = useRef(onInactive)
  const onActiveRef = useRef(onActive)

  // Update refs when callbacks change
  useEffect(() => {
    onInactiveRef.current = onInactive
    onActiveRef.current = onActive
  }, [onInactive, onActive])

  // Sync ref with state
  useEffect(() => {
    isInactiveRef.current = isInactive
  }, [isInactive])

  useEffect(() => {
    // Throttle for mousemove to avoid constant resets
    let lastMouseMoveTime = 0
    const mouseMoveThrottle = 2000

    const resetTimer = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // If currently inactive, mark as active
      if (isInactiveRef.current) {
        setIsInactive(false)
        onActiveRef.current?.()
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setIsInactive(true)
        onInactiveRef.current?.()
      }, timeout)
    }

    const handleActivity = (event: Event) => {
      // Throttle mousemove events
      if (event.type === 'mousemove') {
        const now = Date.now()
        if (now - lastMouseMoveTime < mouseMoveThrottle) {
          return
        }
        lastMouseMoveTime = now
      }

      resetTimer()
    }

    // Set initial timeout
    resetTimer()

    // Event listeners for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel',
      'pointerdown',
      'pointermove'
    ]

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [timeout]) // Only depend on timeout, not isInactive

  return { isInactive }
}
