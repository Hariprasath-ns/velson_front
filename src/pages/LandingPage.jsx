import React from 'react'
import VelsonImg from '../assets/Velson.webp'

export default function LandingPage() {
  return (
    <div className="w-full h-[calc(100vh-46px)] overflow-hidden bg-[#090D16] flex items-center justify-center">
      <img
        src={VelsonImg}
        alt="Velson Dashboard"
        className="w-full h-full object-cover select-none pointer-events-none"
      />
    </div>
  )
}
