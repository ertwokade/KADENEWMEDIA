import { useEffect, useState } from 'react'
import { getContentApi } from '../api'

function hasContent(value) {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value && typeof value === 'object' && Object.keys(value).length > 0)
}

function mergeContent(fallback, value) {
  if (!hasContent(value)) return fallback
  if (Array.isArray(fallback)) return Array.isArray(value) ? value : fallback
  if (fallback && typeof fallback === 'object' && value && typeof value === 'object') {
    return { ...fallback, ...value }
  }
  return value
}

export default function useSiteContent(section, fallback = {}) {
  const [content, setContent] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getContentApi(section)
      .then((response) => {
        if (!cancelled) setContent(mergeContent(fallback, response?.data))
      })
      .catch((requestError) => {
        if (!cancelled) {
          setContent(fallback)
          setError(requestError)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [section, fallback])

  return { content, loading, error }
}
