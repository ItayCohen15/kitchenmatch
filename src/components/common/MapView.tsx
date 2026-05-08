import React, { useEffect, useState } from 'react';

interface Props {
  showWorker?: boolean;
  workerName?: string;
  restaurantName?: string;
  mode?: 'tracking' | 'navigation';
}

export const MapView: React.FC<Props> = ({
  showWorker = true,
  workerName = 'דניאל',
  restaurantName = 'מסעדת הגן',
  mode = 'tracking',
}) => {
  const [workerPos, setWorkerPos] = useState({ x: 130, y: 200 });
  const restaurantPos = { x: 220, y: 110 };

  useEffect(() => {
    if (!showWorker) return;
    const interval = setInterval(() => {
      setWorkerPos(prev => ({
        x: prev.x + (restaurantPos.x - prev.x) * 0.04 + (Math.random() - 0.5) * 2,
        y: prev.y + (restaurantPos.y - prev.y) * 0.04 + (Math.random() - 0.5) * 2,
      }));
    }, 800);
    return () => clearInterval(interval);
  }, [showWorker]);

  const streets = [
    'M 40 80 L 320 80',
    'M 40 140 L 320 140',
    'M 40 200 L 320 200',
    'M 40 260 L 320 260',
    'M 80 40 L 80 310',
    'M 150 40 L 150 310',
    'M 220 40 L 220 310',
    'M 290 40 L 290 310',
    'M 60 60 L 180 130',
    'M 180 60 L 60 130',
    'M 200 160 L 310 220',
  ];

  const blocks = [
    'M 90 90 L 140 90 L 140 130 L 90 130 Z',
    'M 160 90 L 210 90 L 210 130 L 160 130 Z',
    'M 230 90 L 280 90 L 280 130 L 230 130 Z',
    'M 90 150 L 140 150 L 140 190 L 90 190 Z',
    'M 160 150 L 210 150 L 210 190 L 160 190 Z',
    'M 230 150 L 280 150 L 280 190 L 230 190 Z',
    'M 90 210 L 140 210 L 140 250 L 90 250 Z',
    'M 160 210 L 210 210 L 210 250 L 160 250 Z',
    'M 230 210 L 280 210 L 280 250 L 230 250 Z',
  ];

  return (
    <div className="relative w-full h-full bg-[#e8f0e4] rounded-2xl overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 360 310" preserveAspectRatio="xMidYMid slice">
        {/* Background */}
        <rect width="360" height="310" fill="#e8f0e4" />

        {/* Park area */}
        <ellipse cx="60" cy="240" rx="40" ry="35" fill="#c8e6b4" opacity="0.8" />
        <ellipse cx="300" cy="270" rx="30" ry="25" fill="#c8e6b4" opacity="0.8" />

        {/* Building blocks */}
        {blocks.map((d, i) => (
          <path key={i} d={d} fill="#d4dfd0" stroke="#b8cbb4" strokeWidth="0.5" />
        ))}

        {/* Streets */}
        {streets.map((d, i) => (
          <path key={i} d={d} stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        ))}

        {/* Street center lines */}
        {streets.map((d, i) => (
          <path key={`c${i}`} d={d} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="6 4" strokeLinecap="round" />
        ))}

        {/* Route line */}
        {showWorker && (
          <line
            x1={workerPos.x} y1={workerPos.y}
            x2={restaurantPos.x} y2={restaurantPos.y}
            stroke="#f97316" strokeWidth="3" strokeDasharray="6 4"
            opacity="0.8"
          />
        )}

        {/* Restaurant marker */}
        <g transform={`translate(${restaurantPos.x},${restaurantPos.y})`}>
          <circle r="18" fill="#f97316" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="white">🍴</text>
          <circle r="18" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" from="18" to="28" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Restaurant label */}
        <rect
          x={restaurantPos.x - 38} y={restaurantPos.y - 40}
          width="76" height="18" rx="9"
          fill="white" stroke="#f97316" strokeWidth="1"
        />
        <text x={restaurantPos.x} y={restaurantPos.y - 28}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fill="#f97316" fontWeight="600">
          {restaurantName}
        </text>

        {/* Worker marker */}
        {showWorker && (
          <g transform={`translate(${workerPos.x},${workerPos.y})`}>
            <circle r="14" fill={mode === 'navigation' ? '#10b981' : '#3b82f6'} />
            <text textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="white">👷</text>
          </g>
        )}

        {/* Worker label */}
        {showWorker && (
          <>
            <rect
              x={workerPos.x - 28} y={workerPos.y + 17}
              width="56" height="16" rx="8"
              fill="white" stroke={mode === 'navigation' ? '#10b981' : '#3b82f6'} strokeWidth="1"
            />
            <text x={workerPos.x} y={workerPos.y + 26}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill={mode === 'navigation' ? '#10b981' : '#3b82f6'} fontWeight="600">
              {workerName}
            </text>
          </>
        )}
      </svg>

      {/* Distance badge */}
      {showWorker && (
        <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-1.5 shadow-md flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-700">~4 דקות</span>
        </div>
      )}
    </div>
  );
};
