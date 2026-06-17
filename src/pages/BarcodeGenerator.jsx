import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function BarcodeGenerator({ value }) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!value) return

    QRCode.toDataURL(value, {
      margin: 1,
      width: 150, // Crisp resolution for print size
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrDataUrl(url)
      })
      .catch(err => {
        console.error('Error generating QR code:', err)
      })
  }, [value])

  if (!qrDataUrl) return null

  return (
    <img 
      src={qrDataUrl} 
      alt="QR Code" 
      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
    />
  )
}