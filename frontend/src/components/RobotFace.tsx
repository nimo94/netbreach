import React, { useState, useEffect } from 'react';

interface RobotFaceProps {
  progressPercent: number;
  threatPercent: number;
}

export default function RobotFace({ progressPercent, threatPercent }: RobotFaceProps) {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  
  const isAngry = threatPercent >= 70;
  const isAwake = progressPercent > 0 || threatPercent > 0;
  
  // Define emotions based on state
  let emotion = 'sleep';
  if (isAngry) emotion = 'angry';
  else if (isAwake) emotion = 'awake';

  // Random darting logic for the eyes
  useEffect(() => {
    if (emotion === 'sleep') {
      setEyeOffset({ x: 0, y: 0 });
      return;
    }

    const dartInterval = setInterval(() => {
      // Randomly look around
      // X: -15 to +15, Y: -10 to +10
      const newX = (Math.random() * 30) - 15;
      const newY = (Math.random() * 20) - 10;
      setEyeOffset({ x: newX, y: newY });
      
      // Sometimes reset to center
      if (Math.random() > 0.7) {
        setTimeout(() => setEyeOffset({ x: 0, y: 0 }), 500);
      }
    }, emotion === 'angry' ? 800 : 2000); // Darte faster when angry

    return () => clearInterval(dartInterval);
  }, [emotion]);

  // Eye Styles Configuration
  const baseEyeStyle: React.CSSProperties = {
    position: 'absolute',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    top: '50%',
    transformOrigin: 'center center',
  };

  const getLeftEyeStyle = (): React.CSSProperties => {
    let style: React.CSSProperties = { ...baseEyeStyle, left: '30%' };
    
    if (emotion === 'sleep') {
      style.width = '30px';
      style.height = '4px';
      style.backgroundColor = '#4b5563'; // gray-600
      style.borderRadius = '4px';
      style.transform = `translate(-50%, -50%) translateY(20px)`;
    } else if (emotion === 'awake') {
      style.width = '32px';
      style.height = '48px';
      style.backgroundColor = '#22d3ee'; // cyan-400
      style.borderRadius = '12px 12px 8px 8px';
      style.transform = `translate(-50%, -50%) translate(${eyeOffset.x}px, ${eyeOffset.y}px)`;
    } else if (emotion === 'angry') {
      style.width = '36px';
      style.height = '24px';
      style.backgroundColor = '#ef4444'; // red-500
      style.borderRadius = '2px 16px 4px 4px';
      // Slant inward for left eye: rotate positive
      style.transform = `translate(-50%, -50%) translate(${eyeOffset.x}px, ${eyeOffset.y}px) rotate(15deg)`;
      style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.6)';
    }
    return style;
  };

  const getRightEyeStyle = (): React.CSSProperties => {
    let style: React.CSSProperties = { ...baseEyeStyle, right: '30%' };
    
    if (emotion === 'sleep') {
      style.width = '30px';
      style.height = '4px';
      style.backgroundColor = '#4b5563';
      style.borderRadius = '4px';
      style.transform = `translate(50%, -50%) translateY(20px)`;
    } else if (emotion === 'awake') {
      style.width = '32px';
      style.height = '48px';
      style.backgroundColor = '#22d3ee';
      style.borderRadius = '12px 12px 8px 8px';
      style.transform = `translate(50%, -50%) translate(${eyeOffset.x}px, ${eyeOffset.y}px)`;
    } else if (emotion === 'angry') {
      style.width = '36px';
      style.height = '24px';
      style.backgroundColor = '#ef4444';
      style.borderRadius = '16px 2px 4px 4px';
      // Slant inward for right eye: rotate negative
      style.transform = `translate(50%, -50%) translate(${eyeOffset.x}px, ${eyeOffset.y}px) rotate(-15deg)`;
      style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.6)';
    }
    return style;
  };

  return (
    <div className="w-full flex justify-center mb-6">
      <div 
        className={`relative w-[180px] h-[100px] bg-[#050608] border border-nb-border rounded-xl overflow-hidden ${emotion === 'angry' ? 'animate-pulse' : ''}`}
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}
      >
        {/* Screen Glare Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-xl"></div>
        
        {/* Left Eye */}
        <div style={getLeftEyeStyle()}></div>
        
        {/* Right Eye */}
        <div style={getRightEyeStyle()}></div>
      </div>
    </div>
  );
}
