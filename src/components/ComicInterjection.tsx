import React, { useEffect, useState } from 'react';

interface Interjection {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  rotation: number;
}

interface ComicInterjectionProps {
  triggerRef: React.RefObject<any>; // Optional parent ref to position relative to, or just random center
}

// Global triggering channel for interjections
let globalTriggerFn: (text?: string) => void = () => {};

export function triggerComicInterjection(text?: string) {
  globalTriggerFn(text);
}

export default function ComicInterjection() {
  const [items, setItems] = useState<Interjection[]>([]);

  useEffect(() => {
    const interjections = ['WOW!', 'BOOM!', 'KAPOW!', 'BAM!', 'CRACK!', 'CRUNCH!', 'POWER!', 'SPLAT!'];
    const colors = [
      'bg-[#FF007F] text-white',  // Hot Pink
      'bg-[#FF9500] text-black',  // Orange
      'bg-[#FFCC00] text-black',  // Yellow
      'bg-[#4CD964] text-white',  // Green
      'bg-[#5856D6] text-white',  // Purple
      'bg-[#007AFF] text-white',  // Blue
    ];

    globalTriggerFn = (customText?: string) => {
      const text = customText || interjections[Math.floor(Math.random() * interjections.length)];
      const id = Math.random().toString(36).substring(2, 9);
      
      // Random coordinates in center screen
      const x = 30 + Math.random() * 40; // 30% to 70%
      const y = 25 + Math.random() * 40; // 25% to 65%
      const rotation = -20 + Math.random() * 40; // -20deg to +20deg
      const color = colors[Math.random() * colors.length | 0];

      setItems(prev => [...prev, { id, text, x, y, color, rotation }]);

      // Remove after animation completes
      setTimeout(() => {
        setItems(prev => prev.filter(item => item.id !== id));
      }, 1000);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" id="comic-interjections-container">
      {items.map(item => (
        <div
          key={item.id}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
          }}
          className={`absolute ${item.color} font-comic text-4xl md:text-6xl px-10 py-8 comic-border comic-spiky tracking-widest uppercase animate-comic-pop select-none`}
        >
          {/* Halftone dots layer inside interjection */}
          <div className="absolute inset-0 comic-halftone-dense opacity-20 rounded-lg pointer-events-none" />
          <div className="relative z-10">{item.text}</div>
        </div>
      ))}
    </div>
  );
}
