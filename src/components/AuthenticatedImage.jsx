import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AuthenticatedImage({ src, alt, className, fallback }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!src) {
      setImageSrc(null)
      setLoading(false)
      return
    }

    // If it's already a base64, blob, or external web url, use it directly
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http://') || src.startsWith('https://')) {
      setImageSrc(src)
      setLoading(false)
      return
    }

    let isMounted = true
    let blobUrl = null

    const fetchImage = async () => {
      try {
        const response = await api.get(src, { responseType: 'blob', skipGlobalLoader: true })
        if (isMounted) {
          blobUrl = URL.createObjectURL(response.data)
          setImageSrc(blobUrl)
        }
      } catch (err) {
        console.error('Failed to load authenticated image:', src, err)
        if (isMounted) setImageSrc(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchImage()

    return () => {
      isMounted = false
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [src])

  if (loading) {
    return <div className={`animate-pulse bg-slate-100 border border-slate-200 rounded-lg ${className}`} />
  }

  if (!imageSrc) {
    return fallback || null
  }

  return <img src={imageSrc} alt={alt} className={className} />
}
