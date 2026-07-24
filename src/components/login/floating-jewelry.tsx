"use client"

import React from "react"

export type JewelryType = "ring" | "necklace" | "coin" | "bangles" | "bar" | "mangalsutra" | "pendant" | "earrings" | "chain"

interface FloatingJewelryProps {
  type: JewelryType
  style?: React.CSSProperties
  className?: string
  duration?: number
  delay?: number
}

const SVGS = {
  ring: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BF953F" />
          <stop offset="25%" stopColor="#FCF6BA" />
          <stop offset="50%" stopColor="#B38728" />
          <stop offset="75%" stopColor="#FBF5B7" />
          <stop offset="100%" stopColor="#AA771C" />
        </linearGradient>
        <linearGradient id="gold-grad-light" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E2C15A" />
          <stop offset="50%" stopColor="#FFFCA8" />
          <stop offset="100%" stopColor="#C99B2B" />
        </linearGradient>
        <radialGradient id="diamond" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#E6F2FF" />
          <stop offset="80%" stopColor="#B3D9FF" />
          <stop offset="100%" stopColor="#80BFFF" />
        </radialGradient>
      </defs>
      <g>
        <path d="M 22 36 C 22 47.0457 30.9543 56 42 56 C 53.0457 56 62 47.0457 62 36 C 62 24.9543 53.0457 16 42 16 C 30.9543 16 22 24.9543 22 36 Z" fill="none" stroke="url(#gold-grad)" strokeWidth="6" />
        <polygon points="42,4 34,14 50,14" fill="url(#diamond)" stroke="#80BFFF" strokeWidth="0.5"/>
        <polygon points="34,14 42,24 50,14" fill="url(#diamond)" stroke="#80BFFF" strokeWidth="0.5"/>
        <polygon points="34,14 42,14 42,4" fill="#FFFFFF" opacity="0.6"/>
      </g>
    </svg>
  ),
  necklace: (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 20 C 10 45 30 65 40 65 C 50 65 70 45 70 20" fill="none" stroke="url(#gold-grad)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="40" cy="70" r="8" fill="url(#gold-grad-light)" />
      <polygon points="40,64 36,70 40,76 44,70" fill="url(#diamond)" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#gold-grad)" />
      <circle cx="32" cy="32" r="24" fill="url(#gold-grad-light)" />
      <circle cx="32" cy="32" r="22" fill="url(#gold-grad)" stroke="#FCF6BA" strokeWidth="1" />
      <text x="32" y="38" fontSize="16" fontFamily="serif" fontWeight="bold" fill="#AA771C" textAnchor="middle">24K</text>
    </svg>
  ),
  bangles: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="22" rx="28" ry="10" fill="none" stroke="url(#gold-grad)" strokeWidth="6" />
      <ellipse cx="32" cy="32" rx="28" ry="10" fill="none" stroke="url(#gold-grad-light)" strokeWidth="6" />
      <ellipse cx="32" cy="42" rx="28" ry="10" fill="none" stroke="url(#gold-grad)" strokeWidth="6" />
    </svg>
  ),
  bar: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 12 24 L 24 12 L 56 12 L 44 24 Z" fill="url(#gold-grad-light)" />
      <path d="M 56 12 L 56 40 L 44 52 L 44 24 Z" fill="url(#gold-grad)" />
      <path d="M 12 24 L 44 24 L 44 52 L 12 52 Z" fill="url(#gold-grad)" />
      <text x="28" y="42" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#8C5C00" transform="skewX(-15)">999.9</text>
      <text x="28" y="32" fontSize="6" fontFamily="sans-serif" fill="#8C5C00" transform="skewX(-15)">GOLD</text>
    </svg>
  ),
  mangalsutra: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 12 12 C 12 36 24 48 32 48 C 40 48 52 36 52 12" fill="none" stroke="#222" strokeWidth="2.5" strokeDasharray="4 2" />
      <path d="M 16 12 C 16 34 26 44 32 44 C 38 44 48 34 48 12" fill="none" stroke="url(#gold-grad)" strokeWidth="1.5" />
      <path d="M 26 48 C 26 53 28 56 32 56 C 36 56 38 53 38 48" fill="url(#gold-grad)" />
      <circle cx="28" cy="48" r="3.5" fill="url(#gold-grad-light)" />
      <circle cx="36" cy="48" r="3.5" fill="url(#gold-grad-light)" />
    </svg>
  ),
  pendant: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 32 4 L 32 12" stroke="url(#gold-grad)" strokeWidth="4" />
      <circle cx="32" cy="34" r="18" fill="url(#gold-grad-light)" />
      <circle cx="32" cy="34" r="12" fill="url(#gold-grad)" />
      <polygon points="32,24 26,34 32,44 38,34" fill="url(#diamond)" />
    </svg>
  ),
  earrings: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 22 12 Q 22 20 22 24" stroke="url(#gold-grad)" strokeWidth="2" fill="none" />
      <path d="M 14 24 L 30 24 L 26 38 L 18 38 Z" fill="url(#gold-grad)" />
      <circle cx="22" cy="42" r="4" fill="url(#gold-grad-light)" />
      <circle cx="16" cy="39" r="2.5" fill="url(#gold-grad-light)" />
      <circle cx="28" cy="39" r="2.5" fill="url(#gold-grad-light)" />
      <path d="M 42 12 Q 42 20 42 24" stroke="url(#gold-grad)" strokeWidth="2" fill="none" />
      <path d="M 34 24 L 50 24 L 46 38 L 38 38 Z" fill="url(#gold-grad)" />
      <circle cx="42" cy="42" r="4" fill="url(#gold-grad-light)" />
      <circle cx="36" cy="39" r="2.5" fill="url(#gold-grad-light)" />
      <circle cx="48" cy="39" r="2.5" fill="url(#gold-grad-light)" />
    </svg>
  ),
  chain: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="28" cy="16" rx="6" ry="12" fill="none" stroke="url(#gold-grad)" strokeWidth="4" transform="rotate(45 28 16)" />
      <ellipse cx="36" cy="30" rx="6" ry="12" fill="none" stroke="url(#gold-grad-light)" strokeWidth="4" transform="rotate(-45 36 30)" />
      <ellipse cx="28" cy="44" rx="6" ry="12" fill="none" stroke="url(#gold-grad)" strokeWidth="4" transform="rotate(45 28 44)" />
      <ellipse cx="36" cy="58" rx="6" ry="12" fill="none" stroke="url(#gold-grad-light)" strokeWidth="4" transform="rotate(-45 36 58)" />
    </svg>
  )
}

export function FloatingJewelry({ type, style, className = "", duration = 20, delay = 0 }: FloatingJewelryProps) {
  // Random range helper
  const rr = (min: number, max: number) => Math.random() * (max - min) + min;

  // Generate random movement paths (distances in vw/vh to ensure they drift nicely)
  // We keep it within -3 to 3 to ensure they never break out of their grid cells and overlap.
  const x1 = rr(-3, 3); const y1 = rr(-3, 3);
  const x2 = rr(-3, 3); const y2 = rr(-3, 3);
  
  // Rotations for subtle spin (±3° to ±8°)
  const rotMax = rr(3, 8);
  const r1 = Math.random() > 0.5 ? rotMax : -rotMax;
  const r2 = Math.random() > 0.5 ? rotMax : -rotMax;

  const animationStyle = {
    ...style,
    "--x1": `${x1}vw`,
    "--y1": `${y1}vh`,
    "--x2": `${x2}vw`,
    "--y2": `${y2}vh`,
    "--r1": `${r1}deg`,
    "--r2": `${r2}deg`,
    "--anim-duration": `${duration}s`,
    "--anim-delay": `${delay}s`,
    animation: "randomWander var(--anim-duration) ease-in-out var(--anim-delay) infinite",
    willChange: "transform"
  } as React.CSSProperties

  return (
    <div 
      className={`absolute ${className}`} 
      style={animationStyle}
    >
      <div className="w-full h-full">
        {SVGS[type]}
      </div>
    </div>
  )
}
