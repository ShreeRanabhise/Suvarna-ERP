"use client"

import React from "react"

export function LightBeam() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute w-[200%] h-[150%] -top-[25%] -left-[50%] animate-light-beam origin-center transform -rotate-45"
        style={{
          background: 'linear-gradient(to right, transparent 0%, rgba(214,175,54,0.01) 40%, rgba(214,175,54,0.04) 50%, rgba(214,175,54,0.01) 60%, transparent 100%)',
          willChange: 'transform'
        }}
      />
    </div>
  )
}
