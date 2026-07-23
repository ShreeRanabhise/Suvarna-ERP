"use client"

import React, { useEffect, useState } from "react"
import { FloatingJewelry, JewelryType } from "./floating-jewelry"
import { LightBeam } from "./light-beam"

interface ItemConfig {
  id: number
  type: JewelryType
  layer: 1 | 2 | 3
  x: number // percentage
  y: number // percentage
  scale: number
  duration: number
  delay: number
  animationClass: string
}

const JEWELRY_TYPES: JewelryType[] = ["ring", "necklace", "coin", "bangles", "bar", "mangalsutra", "pendant", "earrings", "chain"]

export function AnimatedJewelryBackground() {
  const [items, setItems] = useState<ItemConfig[]>([])
  
  useEffect(() => {
    // Determine count based on screen size
    const width = window.innerWidth
    let count = 0
    if (width > 1024) {
      count = 35 // Desktop
    } else if (width > 640) {
      count = 20 // Tablet
    } else {
      count = 12 // Mobile
    }

    const newItems: ItemConfig[] = []
    
    // Distribute among 3 layers
    for (let i = 0; i < count; i++) {
      const type = JEWELRY_TYPES[Math.floor(Math.random() * JEWELRY_TYPES.length)]
      
      // Determine layer (1: back, 2: middle, 3: front)
      // Layer 1 is 40% of items, Layer 2 is 40%, Layer 3 is 20%
      let layer: 1 | 2 | 3 = 2
      const layerRand = Math.random()
      if (layerRand < 0.4) layer = 1
      else if (layerRand < 0.8) layer = 2
      else layer = 3

      // Properties based on layer
      let scale = 1
      let duration = 30
      
      if (layer === 1) {
        scale = Math.random() * 0.5 + 1.5 // 1.5 - 2.0x
        duration = Math.random() * 20 + 60 // 60 - 80s
      } else if (layer === 2) {
        scale = Math.random() * 0.5 + 0.8 // 0.8 - 1.3x
        duration = Math.random() * 15 + 40 // 40 - 55s
      } else {
        scale = Math.random() * 0.3 + 0.4 // 0.4 - 0.7x
        duration = Math.random() * 10 + 25 // 25 - 35s
      }

      // Randomly assign one of the 3 wander animations
      const animType = Math.floor(Math.random() * 3) + 1
      const animationClass = `animate-wander-${animType}`

      newItems.push({
        id: i,
        type,
        layer,
        x: Math.random() * 100, // 0 - 100%
        y: Math.random() * 100, // 0 - 100%
        scale,
        duration,
        delay: Math.random() * -60, // start immediately at different points
        animationClass
      })
    }
    
    setItems(newItems)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" 
         style={{ background: "#FFFFFF" }}>
      
      <LightBeam />

      {items.map((item) => {
        // Layer styling
        let opacity = "opacity-[0.15]"
        let blur = "blur-none"
        
        if (item.layer === 2) {
          opacity = "opacity-[0.25]"
          blur = "blur-none"
        } else if (item.layer === 3) {
          opacity = "opacity-[0.35]"
          blur = "blur-none"
        }

        return (
          <FloatingJewelry
            key={item.id}
            type={item.type}
            className={`text-[#BA390C] ${opacity} ${blur} ${item.animationClass}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${40 * item.scale}px`,
              height: `${40 * item.scale}px`,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}
