function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="logo-svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer hexagon */}
      <path
        d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        fill="none"
        filter="url(#logoGlow)"
      />
      
      {/* Inner hexagon */}
      <path
        d="M32 14L46 22V38L32 46L18 38V22L32 14Z"
        fill="url(#logoGradient)"
        opacity="0.3"
      />
      
      {/* Center API symbol - stylized { } */}
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="url(#logoGradient)"
        fontSize="20"
        fontFamily="Monaco, Menlo, monospace"
        fontWeight="bold"
        filter="url(#logoGlow)"
      >
        {'{ }'}
      </text>
    </svg>
  );
}

export default Logo;
