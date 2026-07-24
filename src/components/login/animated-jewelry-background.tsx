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
}

const JEWELRY_TYPES: JewelryType[] = ["ring", "necklace", "coin", "bangles", "bar", "mangalsutra", "pendant", "earrings", "chain"]

export function AnimatedJewelryBackground() {
  const [items, setItems] = useState<ItemConfig[]>([])
  
  useEffect(() => {
    // Determine count based on screen size
    const width = window.innerWidth
    let count = 0
    let cols = 1
    let rows = 1
    
    if (width > 1024) {
      cols = 7; rows = 5; // 35 items
    } else if (width > 640) {
      cols = 5; rows = 4; // 20 items
    } else {
      cols = 3; rows = 4; // 12 items
    }
    count = cols * rows

    const newItems: ItemConfig[] = []
    
    // Create a shuffled array of grid indices so layers are distributed randomly across the grid
    const indices = Array.from({ length: count }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Distribute among 3 layers
    for (let i = 0; i < count; i++) {
      const gridIndex = indices[i];
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
        duration = Math.random() * 0.8 + 5.2 // 5.2 - 6.0s (was 2.6 - 3.0s)
      } else if (layer === 2) {
        scale = Math.random() * 0.5 + 0.8 // 0.8 - 1.3x
        duration = Math.random() * 0.8 + 4.4 // 4.4 - 5.2s (was 2.2 - 2.6s)
      } else {
        scale = Math.random() * 0.3 + 0.4 // 0.4 - 0.7x
        duration = Math.random() * 0.8 + 3.6 // 3.6 - 4.4s (was 1.8 - 2.2s)
      }

      // Grid cell logic to prevent overlap
      const col = gridIndex % cols;
      const row = Math.floor(gridIndex / cols);
      
      const cellWidth = 100 / cols;
      const cellHeight = 100 / rows;
      
      // Center of cell
      const baseX = col * cellWidth + (cellWidth / 2);
      const baseY = row * cellHeight + (cellHeight / 2);

      // Safe jitter inside the cell (keep it strictly within cell bounds minus safety margin)
      const jx = (Math.random() - 0.5) * (cellWidth * 0.4); 
      const jy = (Math.random() - 0.5) * (cellHeight * 0.4);

      newItems.push({
        id: i,
        type,
        layer,
        x: baseX + jx,
        y: baseY + jy,
        scale,
        duration,
        delay: Math.random() * -30, // start immediately at different points
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
        let opacity = "opacity-[0.40]"
        let blur = "blur-none"
        
        if (item.layer === 2) {
          opacity = "opacity-[0.60]"
          blur = "blur-none"
        } else if (item.layer === 3) {
          opacity = "opacity-[0.80]"
          blur = "blur-none"
        }

        return (
          <FloatingJewelry
            key={item.id}
            type={item.type}
            className={`text-[#BA390C] ${opacity} ${blur}`}
            duration={item.duration}
            delay={item.delay}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${40 * item.scale}px`,
              height: `${40 * item.scale}px`,
            }}
          />
        )
      })}
    </div>
  )
}
