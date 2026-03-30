/**
 * SplashScreen Variation D: Pixar Lamp Bounce
 *
 * Pin hovers above a circle/hole, bounces 3 times with decreasing height
 * (like the Pixar lamp on the "I"), then drops into the hole and disappears.
 * "DeepMaps" text fades in after pin settles. Total ~2.3s.
 *
 * Drop-in replacement: import and render in DataLoader's isLoading block.
 */
export function SplashScreenD() {
  return (
    <div
      className="h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Stage — pin + hole centered */}
      <div
        className="absolute"
        style={{
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 80,
          height: 140,
        }}
      >
        {/* The hole/circle target — always visible */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2px solid rgba(234, 179, 8, 0.35)',
            background: 'rgba(234, 179, 8, 0.06)',
            opacity: 0,
            animation: 'splashD-hole-in 0.3s ease-out 0.1s forwards',
          }}
        />

        {/* Shadow beneath pin — scales with bounce proximity */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(234, 179, 8, 0.15)',
            opacity: 0,
            animation: 'splashD-shadow 1.7s ease-out 0.25s forwards',
          }}
        />

        {/* Pin — bounces then drops into hole */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%) translateY(-70px)',
            opacity: 0,
            animation: 'splashD-bounce 1.7s cubic-bezier(0.25, 0.1, 0.25, 1) 0.25s forwards',
          }}
        >
          <svg
            width="40"
            height="56"
            viewBox="0 0 40 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            {/* Pin body */}
            <path
              d="M20 4C13.9 4 9 8.9 9 15c0 7.5 11 19 11 19s11-11.5 11-19c0-6.1-4.9-11-11-11z"
              fill="#eab308"
            />
            {/* Pin hole */}
            <circle cx="20" cy="15" r="4.5" fill="var(--bg-primary, #0a0a0a)" />
          </svg>
        </div>
      </div>

      {/* Impact flash — brief ring on final drop */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 80,
          height: 140,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%) scale(0)',
            width: 50,
            height: 50,
            borderRadius: '50%',
            border: '1.5px solid rgba(234, 179, 8, 0.4)',
            opacity: 0,
            animation: 'splashD-impact 0.5s ease-out 1.72s forwards',
          }}
        />
      </div>

      {/* Text block — centered below stage */}
      <div
        className="absolute w-full text-center px-6"
        style={{ top: '54%' }}
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
            animation: 'splashD-text-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 1.85s forwards',
          }}
        >
          <span style={{ color: '#e74c3c' }}>Deep</span>Maps
        </div>

        {/* Tagline */}
        <div
          className="font-mono"
          style={{
            fontSize: 'clamp(11px, 2.2vw, 13px)',
            fontWeight: 400,
            letterSpacing: '0.08em',
            lineHeight: 1.7,
            color: 'rgba(229, 229, 229, 0.45)',
            marginTop: 20,
            opacity: 0,
            animation: 'splashD-fade-in 0.4s ease-out 2.15s forwards',
          }}
        >
          Everything that ever happened
          <br />
          happened somewhere.
        </div>
      </div>

      <style>{`
        @keyframes splashD-hole-in {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.5);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        /* Pin bounce sequence:
           0%    — hovering high, invisible
           8%    — visible, still high
           25%   — first impact (ground level)
           33%   — first bounce apex (high)
           50%   — second impact
           56%   — second bounce apex (medium)
           68%   — third impact
           72%   — third bounce apex (small)
           80%   — settle at ground
           88%   — pause at ground
           100%  — drop into hole + disappear
        */
        @keyframes splashD-bounce {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-70px);
          }
          8% {
            opacity: 1;
            transform: translateX(-50%) translateY(-70px);
          }
          /* First impact */
          25% {
            transform: translateX(-50%) translateY(0px);
          }
          /* Squash on impact */
          27% {
            transform: translateX(-50%) translateY(2px) scaleY(0.9) scaleX(1.08);
          }
          /* First bounce — high */
          35% {
            transform: translateX(-50%) translateY(-45px);
          }
          /* Second impact */
          48% {
            transform: translateX(-50%) translateY(0px);
          }
          50% {
            transform: translateX(-50%) translateY(1px) scaleY(0.93) scaleX(1.05);
          }
          /* Second bounce — medium */
          57% {
            transform: translateX(-50%) translateY(-22px);
          }
          /* Third impact */
          66% {
            transform: translateX(-50%) translateY(0px);
          }
          67% {
            transform: translateX(-50%) translateY(1px) scaleY(0.96) scaleX(1.03);
          }
          /* Third bounce — small */
          72% {
            transform: translateX(-50%) translateY(-8px);
          }
          /* Settle */
          78% {
            transform: translateX(-50%) translateY(0px);
            opacity: 1;
          }
          /* Brief pause */
          88% {
            transform: translateX(-50%) translateY(0px);
            opacity: 1;
          }
          /* Drop into hole */
          96% {
            transform: translateX(-50%) translateY(16px) scale(0.6);
            opacity: 0.4;
          }
          100% {
            transform: translateX(-50%) translateY(22px) scale(0.3);
            opacity: 0;
          }
        }

        /* Shadow pulses with each bounce */
        @keyframes splashD-shadow {
          0% {
            opacity: 0;
            transform: translateX(-50%) scaleX(0.5);
          }
          8% {
            opacity: 0.3;
            transform: translateX(-50%) scaleX(0.6);
          }
          /* First impact — shadow expands */
          25% {
            opacity: 1;
            transform: translateX(-50%) scaleX(1.3);
          }
          /* Bounce up — shadow shrinks */
          35% {
            opacity: 0.4;
            transform: translateX(-50%) scaleX(0.6);
          }
          /* Second impact */
          48% {
            opacity: 1;
            transform: translateX(-50%) scaleX(1.15);
          }
          /* Bounce up */
          57% {
            opacity: 0.5;
            transform: translateX(-50%) scaleX(0.7);
          }
          /* Third impact */
          66% {
            opacity: 0.9;
            transform: translateX(-50%) scaleX(1.05);
          }
          /* Small bounce */
          72% {
            opacity: 0.6;
            transform: translateX(-50%) scaleX(0.8);
          }
          /* Settle */
          78% {
            opacity: 0.8;
            transform: translateX(-50%) scaleX(1);
          }
          88% {
            opacity: 0.8;
            transform: translateX(-50%) scaleX(1);
          }
          /* Disappear with pin */
          100% {
            opacity: 0;
            transform: translateX(-50%) scaleX(0.3);
          }
        }

        /* Impact ring on final drop */
        @keyframes splashD-impact {
          0% {
            opacity: 0.6;
            transform: translateX(-50%) scale(0.3);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) scale(1.5);
          }
        }

        @keyframes splashD-text-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes splashD-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
