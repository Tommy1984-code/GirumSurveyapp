import React from 'react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="relative w-full max-w-6xl aspect-video flex items-center justify-center">

        <div className="relative z-10 flex items-center justify-center" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
          <span className="text-white text-[180px] font-light tracking-[-0.05em] leading-none" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>4</span>
          
          <div className="w-[140px] h-[180px] mx-4 flex items-center justify-center">
            <svg viewBox="-50 -50 100 100" className="w-full h-full">
              <g filter="url(#glow)">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 0 0"
                  to="360 0 0"
                  dur="8s"
                  repeatCount="indefinite"
                />
                <path
                  d="M -35 -15 A 38 38 0 0 1 -15 -35"
                  fill="none"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.95"
                />
                <path
                  d="M 15 -35 A 38 38 0 0 1 35 -15"
                  fill="none"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.95"
                />
                <path
                  d="M 35 15 A 38 38 0 0 1 15 35"
                  fill="none"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.95"
                />
                <path
                  d="M -15 35 A 38 38 0 0 1 -35 15"
                  fill="none"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.95"
                />
              </g>
            </svg>
          </div>
          
          <span className="text-white text-[180px] font-light tracking-[-0.05em] leading-none" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>4</span>
        </div>

        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center z-10">
          <h1 className="text-white text-4xl font-bold mb-3 tracking-wide">Page Not Found</h1>
          <p className="text-gray-400 text-lg">Sorry, we couldn't find the page you're looking for.</p>
        </div>
      </div>
    </div>
  );
}
