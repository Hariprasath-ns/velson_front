  import React from 'react'
  import VelsonImg from '../assets/VELSONERP.png'

  export default function LandingPage() {
    return (
      <div className="w-full h-[calc(100vh-46px)] overflow-hidden bg-[#020610] flex items-center justify-center">
        <img
          src={VelsonImg}
          alt="Velson Dashboard"
          className="h-full w-auto object-contain select-none pointer-events-none"
        />
      </div>
    )
  }
