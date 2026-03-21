/**
 * SplashScreen Variation A: Classic Pin Drop
 *
 * Black screen -> pin drops from top with spring-bounce physics ->
 * ripple ring expands from landing point -> "Deep Maps" fades in ->
 * tagline appears on two lines. Total ~1.8s.
 *
 * Drop-in replacement: import and render in DataLoader's isLoading block.
 */
export function SplashScreenA() {
  return (
    <div
      className="h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Pin + ripple container — positioned slightly above center */}
      <div className="absolute" style={{ top: '35%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {/* Ripple ring — expands from pin landing point */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '58px', // base of pin
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            animation: 'splashA-ripple 1.0s cubic-bezier(0.0, 0.0, 0.2, 1) 0.7s forwards',
            opacity: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '1.5px solid rgba(234, 179, 8, 0.35)',
              opacity: 0,
              animation: 'splashA-ripple-ring 1.0s cubic-bezier(0.0, 0.0, 0.2, 1) 0.7s forwards',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              opacity: 0,
              animation: 'splashA-ripple-ring 0.8s cubic-bezier(0.0, 0.0, 0.2, 1) 0.85s forwards',
            }}
          />
        </div>

        {/* Pin SVG — drops from above with spring bounce */}
        <svg
          width="56"
          height="80"
          viewBox="0 0 56 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            display: 'block',
            margin: '0 auto',
            animation: 'splashA-pin-drop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards',
            opacity: 0,
            transform: 'translateY(-80px)',
          }}
        >
          {/* Shadow at base */}
          <ellipse
            cx="28" cy="72" rx="14" ry="4"
            fill="rgba(234, 179, 8, 0.12)"
            style={{
              animation: 'splashA-shadow 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards',
              opacity: 0,
              transformOrigin: '28px 72px',
              transform: 'scale(0.3)',
            }}
          />
          {/* Pin body */}
          <path
            d="M28 6C20.3 6 14 12.3 14 20c0 10.5 14 26 14 26s14-15.5 14-26c0-7.7-6.3-14-14-14z"
            fill="#eab308"
          />
          {/* Pin hole */}
          <circle cx="28" cy="20" r="5.5" fill="var(--bg-primary, #0a0a0a)" />
        </svg>
      </div>

      {/* Text block — centered below pin */}
      <div
        className="absolute w-full text-center px-6"
        style={{ top: '52%' }}
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
            animation: 'splashA-text-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) 0.9s forwards',
            opacity: 0,
          }}
        >
          Deep Maps
        </div>

        {/* Tagline — two lines */}
        <div
          className="font-mono"
          style={{
            fontSize: 'clamp(11px, 2.2vw, 13px)',
            fontWeight: 400,
            letterSpacing: '0.08em',
            lineHeight: 1.7,
            color: 'rgba(229, 229, 229, 0.45)',
            marginTop: 20,
            animation: 'splashA-fade-in 0.5s ease-out 1.3s forwards',
            opacity: 0,
          }}
        >
          Everything that ever happened
          <br />
          happened somewhere.
        </div>
      </div>

      <style>{`
        @keyframes splashA-pin-drop {
          0% {
            opacity: 0;
            transform: translateY(-80px);
          }
          50% {
            opacity: 1;
          }
          75% {
            transform: translateY(4px);
          }
          85% {
            transform: translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes splashA-shadow {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          75% {
            transform: scale(1.15);
          }
          85% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes splashA-ripple-ring {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes splashA-ripple {
          0% { opacity: 1; }
          100% { opacity: 1; }
        }

        @keyframes splashA-text-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes splashA-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
