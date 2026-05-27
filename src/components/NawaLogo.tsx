import React from 'react';

interface NawaLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function NawaLogo({ className = '', width = '100%', height = '100%' }: NawaLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={width}
      height={height}
      className={className}
    >
      <defs>
        <filter id="arcane-crown-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g transform="translate(0, 0)">
        <polygon 
          points="60,35 75,60 60,85 45,60" 
          fill="#FFFFFF" 
          filter="url(#arcane-crown-glow)" 
        />

        <g fill="rgba(255, 255, 255, 0.75)">
          <polygon points="20,50 40,40 40,55 25,65" />
          <polygon points="100,50 80,40 80,55 95,65" />
        </g>

        <g fill="rgba(255, 255, 255, 0.75)">
          <polygon points="35,25 39,30 35,35 31,30" />
          <polygon points="60,10 65,16 60,22 55,16" />
          <polygon points="85,25 89,30 85,35 81,30" />
        </g>

        <g fill="rgba(255, 255, 255, 0.40)">
          <polygon points="35,95 40,100 35,105 30,100" />
          <polygon points="60,100 65,105 60,110 55,105" />
          <polygon points="85,95 90,100 85,105 80,100" />
        </g>
      </g>
    </svg>
  );
}
