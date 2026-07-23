"use client"

import React from "react"

export type JewelryType = "ring" | "necklace" | "coin" | "bangles" | "bar" | "mangalsutra" | "pendant" | "earrings" | "chain"

interface FloatingJewelryProps {
  type: JewelryType
  style?: React.CSSProperties
  className?: string
}

const SVGS = {
  ring: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Band */}
      <path d="M22 32C22 43.0457 30.9543 52 42 52C53.0457 52 62 43.0457 62 32C62 20.9543 53.0457 12 42 12" />
      <path d="M22 32C22 20.9543 30.9543 12 42 12" opacity="0.3" />
      {/* Diamond */}
      <path d="M12 22L22 32L32 22L26 12H18L12 22Z" />
      <path d="M12 22H32M18 12L22 22L26 12" />
    </svg>
  ),
  necklace: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8C12 25.6731 26.3269 40 44 40C61.6731 40 76 25.6731 76 8" strokeDasharray="3 3" />
      <path d="M44 40V48" />
      <circle cx="44" cy="52" r="4" />
      <path d="M44 56L40 60H48L44 56Z" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="28" />
      <circle cx="32" cy="32" r="22" strokeDasharray="4 4" />
      <path d="M32 18V46M24 26H40M24 38H40" />
      <circle cx="32" cy="32" r="4" />
    </svg>
  ),
  bangles: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="32" cy="24" rx="28" ry="12" />
      <ellipse cx="32" cy="32" rx="28" ry="12" opacity="0.7" />
      <ellipse cx="32" cy="40" rx="28" ry="12" opacity="0.4" />
    </svg>
  ),
  bar: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 20L22 12H50L58 20V44L50 52H22L14 44V20Z" />
      <path d="M22 12V36L14 44M50 12V36L58 44M22 36H50" />
      <circle cx="36" cy="24" r="4" />
      <path d="M32 24H40" />
    </svg>
  ),
  mangalsutra: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Double chain */}
      <path d="M8 12C12 36 24 48 32 48C40 48 52 36 56 12" strokeDasharray="1 3" />
      <path d="M12 10C15.3333 34 26.3333 45 32 45C37.6667 45 48.6667 34 52 10" strokeDasharray="1 3" />
      {/* Watis (Twin cups) */}
      <path d="M26 48C26 52 28.6863 56 32 56C35.3137 56 38 52 38 48" />
      <circle cx="28" cy="48" r="2" />
      <circle cx="36" cy="48" r="2" />
      <path d="M32 56L32 60" />
    </svg>
  ),
  pendant: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 8L32 16" />
      <path d="M32 16C40 16 48 24 48 36C48 48 32 60 32 60C32 60 16 48 16 36C16 24 24 16 32 16Z" />
      <circle cx="32" cy="36" r="8" />
      <path d="M32 28V32M32 40V44M24 36H28M36 36H40" />
    </svg>
  ),
  earrings: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Left Earring */}
      <path d="M22 12C22 12 24 18 22 24" />
      <path d="M16 24C16 24 22 20 28 24C28 32 16 32 16 24Z" />
      <path d="M18 30V38M22 32V40M26 30V38" />
      {/* Right Earring */}
      <path d="M42 12C42 12 44 18 42 24" />
      <path d="M36 24C36 24 42 20 48 24C48 32 36 32 36 24Z" />
      <path d="M38 30V38M42 32V40M46 30V38" />
    </svg>
  ),
  chain: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="28" y="8" width="8" height="16" rx="4" transform="rotate(45 32 16)" />
      <rect x="28" y="24" width="8" height="16" rx="4" transform="rotate(-45 32 32)" />
      <rect x="28" y="40" width="8" height="16" rx="4" transform="rotate(45 32 48)" />
      <path d="M32 8V4M32 60V56" />
    </svg>
  )
}

export function FloatingJewelry({ type, style, className = "" }: FloatingJewelryProps) {
  return (
    <div 
      className={`absolute will-change-transform ${className}`} 
      style={style}
    >
      <div className="w-full h-full animate-spin-slow">
        {SVGS[type]}
      </div>
    </div>
  )
}
