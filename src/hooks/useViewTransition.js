import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export function useViewTransition() {
  const navigate = useNavigate()

  return useCallback((to) => {
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => {
        navigate(to)
      })
    } else {
      navigate(to)
    }
  }, [navigate])
}

export function viewTransitionName(key) {
  return { viewTransitionName: `vt-${key}` }
}
