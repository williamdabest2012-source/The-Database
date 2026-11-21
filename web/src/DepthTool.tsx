type Props = { stage: number; className?: string };

export function DepthTool({ stage, className = 'h-6 w-6' }: Props) {
  const isSpatula = stage <= 1;
  const wide = stage >= 1;
  const hot = stage >= 3;
  const core = stage >= 4;
  const blade = isSpatula ? (wide ? '#f0c878' : '#f8d48b') : hot ? '#ffb36a' : '#9ad4ff';
  const metal = core ? '#ffe7a8' : hot ? '#ff8a4a' : '#c5e8ff';

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      {isSpatula ? (
        <>
          <rect x="14.2" y="11" width="3.6" height="16" rx="1.6" fill="#6b4423" />
          <rect x="13.4" y="25.2" width="5.2" height="3.2" rx="1.4" fill="#4a2e16" />
          <path
            d={
              wide
                ? 'M6.5 4.2h19c.8 0 1.3.7 1.2 1.4l-1.6 8.4c-.1.7-.7 1.1-1.3 1.1H9.2c-.6 0-1.2-.4-1.3-1.1L6.3 5.6c-.1-.7.4-1.4 1.2-1.4Z'
                : 'M8 4.5h16c.7 0 1.2.6 1.1 1.3l-1.4 8.2c-.1.6-.6 1-1.2 1H9.5c-.6 0-1.1-.4-1.2-1L6.9 5.8c-.1-.7.4-1.3 1.1-1.3Z'
            }
            fill={blade}
            stroke="#c9a05a"
            strokeWidth="0.8"
          />
          <path d="M9.4 7.2h13.2" stroke="#fff6d8" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
        </>
      ) : (
        <>
          <rect x="14" y="13" width="4" height="15" rx="1.8" fill={hot ? '#5a2a18' : '#4a5568'} />
          <rect x="12.5" y="25.5" width="7" height="3.5" rx="1.4" fill={hot ? '#3a1810' : '#2d3748'} />
          <path d="M16 3.2 10.6 13.8h10.8L16 3.2Z" fill={metal} stroke={hot ? '#ff7a3a' : '#7eb8e8'} strokeWidth="0.8" />
          <path d="M16 5.5v7.2" stroke="#fff" strokeWidth="0.9" opacity="0.45" />
          <path d="M13.2 10.2h5.6M12.2 12.4h7.6" stroke={hot ? '#9a3a18' : '#5a8ab0'} strokeWidth="0.7" />
          {core && <circle cx="16" cy="8" r="2.2" fill="#fff3d6" opacity="0.85" />}
        </>
      )}
    </svg>
  );
}
