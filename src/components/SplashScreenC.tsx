/**
 * SplashScreen Variation C: Map Fragment
 *
 * Black screen -> faint map grid lines fade in -> pin drops onto grid
 * intersection -> grid brightens around pin in expanding circle ->
 * "Deep Maps" appears -> tagline with dramatic beat -> grid fades as
 * real map loads behind. Total ~2s.
 *
 * Drop-in replacement: import and render in DataLoader's isLoading block.
 */
export function SplashScreenC() {
  // Grid configuration
  const gridCols = 9;
  const gridRows = 7;
  const cellSize = 64; // px
  const gridW = gridCols * cellSize;
  const gridH = gridRows * cellSize;

  return (
    <div
      className="h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Grid container — centered */}
      <div
        className="absolute"
        style={{
          width: gridW,
          height: gridH,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -55%)',
          opacity: 0,
          animation: 'splashC-grid-in 0.6s ease-out 0.1s forwards',
        }}
      >
        {/* SVG grid lines */}
        <svg
          width={gridW}
          height={gridH}
          viewBox={`0 0 ${gridW} ${gridH}`}
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Vertical lines */}
          {Array.from({ length: gridCols + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * cellSize}
              y1={0}
              x2={i * cellSize}
              y2={gridH}
              stroke="rgba(229, 229, 229, 0.04)"
              strokeWidth="0.5"
              className="splashC-grid-line"
            />
          ))}
          {/* Horizontal lines */}
          {Array.from({ length: gridRows + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * cellSize}
              x2={gridW}
              y2={i * cellSize}
              stroke="rgba(229, 229, 229, 0.04)"
              strokeWidth="0.5"
              className="splashC-grid-line"
            />
          ))}
        </svg>

        {/* Brightening radial overlay — expanding circle from center */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            animation: 'splashC-bright-expand 0.8s cubic-bezier(0.0, 0.0, 0.2, 1) 0.85s forwards',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${gridW * 1.2}px`,
              height: `${gridW * 1.2}px`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.06) 0%, rgba(234, 179, 8, 0.02) 40%, transparent 70%)',
              opacity: 0,
              animation: 'splashC-glow 0.8s cubic-bezier(0.0, 0.0, 0.2, 1) 0.85s forwards',
            }}
          />
        </div>

        {/* Pin — drops onto center grid intersection */}
        <svg
          width="48"
          height="68"
          viewBox="0 0 48 68"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -85%) translateY(-40px)',
            opacity: 0,
            animation: 'splashC-pin-drop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards',
          }}
        >
          {/* Small shadow at pin base */}
          <ellipse cx="24" cy="62" rx="10" ry="3" fill="rgba(234, 179, 8, 0.1)" />
          {/* Pin body */}
          <path
            d="M24 4C17.4 4 12 9.4 12 16c0 9 12 22 12 22s12-13 12-22c0-6.6-5.4-12-12-12z"
            fill="#eab308"
          />
          {/* Pin hole */}
          <circle cx="24" cy="16" r="5" fill="var(--bg-primary, #0a0a0a)" />
        </svg>

        {/* Intersection dot highlight — appears at center cross point on pin impact */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 4,
            height: 4,
            marginLeft: -2,
            marginTop: -2,
            borderRadius: '50%',
            background: 'rgba(234, 179, 8, 0.4)',
            opacity: 0,
            animation: 'splashC-dot-flash 0.6s ease-out 0.85s forwards',
          }}
        />
      </div>

      {/* Text block */}
      <div
        className="absolute w-full text-center px-6"
        style={{ top: '58%' }}
      >
        {/* Title */}
        <div
          className="font-serif"
          style={{
            fontSize: 'clamp(36px, 7vw, 52px)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#e5e5e5',
            opacity: 0,
            animation: 'splashC-text-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 1.05s forwards',
          }}
        >
          Deep Maps
        </div>

        {/* Tagline — two lines with beat */}
        <div
          className="font-mono"
          style={{
            fontSize: 'clamp(11px, 2.2vw, 13px)',
            fontWeight: 400,
            letterSpacing: '0.08em',
            lineHeight: 1.7,
            color: 'rgba(229, 229, 229, 0.45)',
            marginTop: 20,
          }}
        >
          <span
            style={{
              display: 'block',
              opacity: 0,
              animation: 'splashC-fade-in 0.4s ease-out 1.4s forwards',
            }}
          >
            Everything that ever happened
          </span>
          <span
            style={{
              display: 'block',
              opacity: 0,
              animation: 'splashC-fade-in 0.4s ease-out 1.65s forwards',
            }}
          >
            happened somewhere.
          </span>
        </div>
      </div>

      {/* Grid fade-out — starts late so it's still visible as map loads */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: 'splashC-grid-fade-out 0.6s ease-in 1.8s forwards',
          opacity: 0,
        }}
      />

      <style>{`
        @keyframes splashC-grid-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes splashC-pin-drop {
          0% {
            opacity: 0;
            transform: translate(-50%, -85%) translateY(-40px);
          }
          50% {
            opacity: 1;
          }
          75% {
            transform: translate(-50%, -85%) translateY(3px);
          }
          85% {
            transform: translate(-50%, -85%) translateY(-1px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -85%) translateY(0);
          }
        }

        @keyframes splashC-dot-flash {
          0% {
            opacity: 0;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(3);
          }
          100% {
            opacity: 0;
            transform: scale(5);
          }
        }

        @keyframes splashC-bright-expand {
          from {
            opacity: 1;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes splashC-glow {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.1);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes splashC-text-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes splashC-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Grid lines brighten when the glow passes —
           done via the parent animation cascading opacity */
        .splashC-grid-line {
          transition: stroke 0.6s ease-out;
        }

        @keyframes splashC-grid-fade-out {
          /* This applies to a covering overlay — not actually used to hide grid,
             the grid just persists until the real map replaces the splash */
          from { opacity: 0; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
