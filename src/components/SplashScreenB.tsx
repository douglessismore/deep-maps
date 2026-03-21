/**
 * SplashScreen Variation B: Pulse & Reveal
 *
 * Black screen -> small dot appears, pulses once -> dot morphs into pin shape ->
 * concentric sonar rings pulse outward -> "Deep Maps" materializes letter by
 * letter (~0.4s) -> tagline fades in. Total ~2s.
 *
 * Drop-in replacement: import and render in DataLoader's isLoading block.
 */
export function SplashScreenB() {
  const title = 'Deep Maps';

  return (
    <div
      className="h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Center anchor for pin + rings */}
      <div
        className="absolute"
        style={{ top: '36%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {/* Sonar rings — 3 concentric, staggered */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${100 + i * 60}px`,
              height: `${100 + i * 60}px`,
              transform: 'translate(-50%, -50%) scale(0)',
              borderRadius: '50%',
              border: `1px solid rgba(234, 179, 8, ${0.25 - i * 0.07})`,
              opacity: 0,
              animation: `splashB-sonar 1.2s cubic-bezier(0.0, 0.0, 0.2, 1) ${0.8 + i * 0.15}s forwards`,
            }}
          />
        ))}

        {/* Dot -> Pin morph */}
        <div
          style={{
            position: 'relative',
            width: 56,
            height: 80,
            margin: '0 auto',
          }}
        >
          {/* Initial dot */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '25%', // center of where pin head will be
              width: 8,
              height: 8,
              marginLeft: -4,
              marginTop: -4,
              borderRadius: '50%',
              background: '#eab308',
              opacity: 0,
              animation: 'splashB-dot-appear 0.3s ease-out 0.15s forwards, splashB-dot-pulse 0.4s ease-in-out 0.45s forwards, splashB-dot-hide 0.2s ease-out 0.7s forwards',
            }}
          />

          {/* Pin — fades in as dot disappears */}
          <svg
            width="56"
            height="80"
            viewBox="0 0 56 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              display: 'block',
              opacity: 0,
              transform: 'scale(0.6)',
              animation: 'splashB-pin-reveal 0.45s cubic-bezier(0.34, 1.2, 0.64, 1) 0.7s forwards',
            }}
          >
            {/* Shadow */}
            <ellipse cx="28" cy="72" rx="12" ry="3.5" fill="rgba(234, 179, 8, 0.1)" />
            {/* Pin body */}
            <path
              d="M28 6C20.3 6 14 12.3 14 20c0 10.5 14 26 14 26s14-15.5 14-26c0-7.7-6.3-14-14-14z"
              fill="#eab308"
            />
            {/* Pin hole */}
            <circle cx="28" cy="20" r="5.5" fill="var(--bg-primary, #0a0a0a)" />
          </svg>
        </div>
      </div>

      {/* Text block */}
      <div
        className="absolute w-full text-center px-6"
        style={{ top: '53%' }}
      >
        {/* Title — letter-by-letter materialization */}
        <div
          className="font-serif"
          style={{
            fontSize: 'clamp(36px, 7vw, 52px)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#e5e5e5',
          }}
          aria-label={title}
        >
          {title.split('').map((char, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: 0,
                transform: 'translateY(4px)',
                animation: `splashB-letter 0.15s cubic-bezier(0.25, 0.1, 0.25, 1) ${1.1 + i * 0.04}s forwards`,
                // Preserve space width
                ...(char === ' ' ? { width: '0.25em' } : {}),
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
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
            animation: 'splashB-fade-in 0.5s ease-out 1.55s forwards',
          }}
        >
          Everything that ever happened
          <br />
          happened somewhere.
        </div>
      </div>

      <style>{`
        @keyframes splashB-dot-appear {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes splashB-dot-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.8); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes splashB-dot-hide {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes splashB-pin-reveal {
          from {
            opacity: 0;
            transform: scale(0.6);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes splashB-sonar {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes splashB-letter {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes splashB-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
