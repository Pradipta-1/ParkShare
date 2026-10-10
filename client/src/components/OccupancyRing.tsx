import React from 'react';

interface OccupancyRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showDetails?: boolean;
}

export const OccupancyRing: React.FC<OccupancyRingProps> = ({
  percentage,
  size = 72,
  strokeWidth = 6,
  label = 'Occupancy',
  showDetails = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on availability pressure
  let strokeColor = '#10b981'; // emerald (< 70%)
  if (percentage >= 85) {
    strokeColor = '#ef4444'; // red (nearly full)
  } else if (percentage >= 70) {
    strokeColor = '#f59e0b'; // amber
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-white tracking-tight leading-none">{percentage}%</span>
        </div>
      </div>
      {showDetails && (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-300">{label}</span>
          <span className="text-[11px] text-slate-400">
            {percentage < 70 ? 'High availability' : percentage < 85 ? 'Moderate spots' : 'Limited spots'}
          </span>
        </div>
      )}
    </div>
  );
};
