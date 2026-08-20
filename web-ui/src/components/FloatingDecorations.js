import React from 'react';
import Snowfall from 'react-snowfall';

// Ultra-Detailed 3D Crystal & Stained-Glass Butterfly Component (smaller scale)
const IridescentButterfly3D = ({ scale = 0.45, speed = '0.3s', type = 'crystal' }) => {
  const isMonarch = type === 'monarch';

  return (
    <div
      className="butterfly-3d-container"
      style={{
        width: `${75 * scale}px`,
        height: `${70 * scale}px`,
        perspective: '800px',
        transformStyle: 'preserve-3d',
        position: 'relative'
      }}
    >
      {/* Soft Realistic 3D Ground Shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10px',
          left: '15%',
          width: '70%',
          height: '12px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '50%',
          filter: 'blur(6px)',
          transform: 'rotateX(75deg) scale(0.9)',
          animation: `shadowPulse ${speed} ease-in-out infinite alternate`
        }}
      />

      <div
        className="butterfly-3d-body"
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(30deg) rotateY(-15deg) rotateZ(-10deg)',
          filter: 'drop-shadow(0 6px 12px rgba(255, 117, 140, 0.4))'
        }}
      >
        {/* Left Wing 3D (Flapping) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%',
            transformOrigin: 'right center',
            animation: `flapLeft3D ${speed} ease-in-out infinite alternate`,
            transformStyle: 'preserve-3d'
          }}
        >
          <svg viewBox="0 0 100 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="crystalGradL" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.95" />
                <stop offset="40%" stopColor="#c084fc" stopOpacity="0.9" />
                <stop offset="85%" stopColor="#ff758c" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffedd5" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="monarchGradL" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9900" stopOpacity="1" />
                <stop offset="70%" stopColor="#ff5500" stopOpacity="1" />
                <stop offset="100%" stopColor="#cc2200" stopOpacity="1" />
              </linearGradient>
            </defs>

            <path
              d="M95,60 C60,-15 10,0 5,45 C0,70 40,80 95,60 Z"
              fill={isMonarch ? 'url(#monarchGradL)' : 'url(#crystalGradL)'}
              stroke={isMonarch ? '#000' : 'rgba(255,255,255,0.9)'}
              strokeWidth={isMonarch ? '4' : '2'}
            />
            <path
              d="M95,60 C50,65 15,75 25,105 C35,120 75,110 95,60 Z"
              fill={isMonarch ? 'url(#monarchGradL)' : 'url(#crystalGradL)'}
              stroke={isMonarch ? '#000' : 'rgba(255,255,255,0.9)'}
              strokeWidth={isMonarch ? '4' : '2'}
            />

            {!isMonarch && (
              <>
                <path d="M90,55 C60,20 30,25 20,45" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                <path d="M85,55 C55,40 35,45 25,65" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                <circle cx="25" cy="35" r="4" fill="#fff" opacity="0.9" />
              </>
            )}

            {isMonarch && (
              <>
                <path d="M90,55 C50,15 20,20 15,45" fill="none" stroke="#000" strokeWidth="3" />
                <path d="M85,55 C50,45 30,50 25,70" fill="none" stroke="#000" strokeWidth="3" />
                <circle cx="12" cy="40" r="2" fill="#fff" />
              </>
            )}
          </svg>
        </div>

        {/* Right Wing 3D (Flapping) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            transformOrigin: 'left center',
            animation: `flapRight3D ${speed} ease-in-out infinite alternate`,
            transformStyle: 'preserve-3d'
          }}
        >
          <svg viewBox="0 0 100 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="crystalGradR" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.95" />
                <stop offset="40%" stopColor="#c084fc" stopOpacity="0.9" />
                <stop offset="85%" stopColor="#ff758c" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffedd5" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="monarchGradR" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff9900" stopOpacity="1" />
                <stop offset="70%" stopColor="#ff5500" stopOpacity="1" />
                <stop offset="100%" stopColor="#cc2200" stopOpacity="1" />
              </linearGradient>
            </defs>

            <path
              d="M5,60 C40,-15 90,0 95,45 C100,70 60,80 5,60 Z"
              fill={isMonarch ? 'url(#monarchGradR)' : 'url(#crystalGradR)'}
              stroke={isMonarch ? '#000' : 'rgba(255,255,255,0.9)'}
              strokeWidth={isMonarch ? '4' : '2'}
            />
            <path
              d="M5,60 C50,65 85,75 75,105 C65,120 25,110 5,60 Z"
              fill={isMonarch ? 'url(#monarchGradR)' : 'url(#crystalGradR)'}
              stroke={isMonarch ? '#000' : 'rgba(255,255,255,0.9)'}
              strokeWidth={isMonarch ? '4' : '2'}
            />

            {!isMonarch && (
              <>
                <path d="M10,55 C40,20 70,25 80,45" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                <path d="M15,55 C45,40 65,45 75,65" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                <circle cx="75" cy="35" r="4" fill="#fff" opacity="0.9" />
              </>
            )}

            {isMonarch && (
              <>
                <path d="M10,55 C50,15 80,20 85,45" fill="none" stroke="#000" strokeWidth="3" />
                <path d="M15,55 C50,45 70,50 75,70" fill="none" stroke="#000" strokeWidth="3" />
                <circle cx="88" cy="40" r="2" fill="#fff" />
              </>
            )}
          </svg>
        </div>

        {/* Thorax Body */}
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 2px)',
            top: '15%',
            width: '4px',
            height: '70%',
            background: isMonarch ? '#111' : '#3b232a',
            borderRadius: '12px'
          }}
        />
      </div>
    </div>
  );
};

// Photorealistic Natural Grass Footer Layer with Multiply Blending & Organic Wind Physics
const AnimatedGrassFooter = () => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '95px',
        pointerEvents: 'none',
        zIndex: 9998,
        overflow: 'hidden'
      }}
    >
      {/* Background Natural Grass Layer */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '-5%',
          width: '110vw',
          height: '85px',
          backgroundImage: 'url(/real_natural_grass.png)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          mixBlendMode: 'multiply',
          opacity: 0.85,
          transformOrigin: '50% 100%',
          animation: 'swayGrassNatural1 4.5s ease-in-out infinite alternate'
        }}
      />

      {/* Foreground Natural Grass Layer (Shifted for Real Density) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '5%',
          width: '110vw',
          height: '95px',
          backgroundImage: 'url(/real_natural_grass.png)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          mixBlendMode: 'multiply',
          opacity: 0.95,
          transformOrigin: '50% 100%',
          animation: 'swayGrassNatural2 3.2s ease-in-out infinite alternate'
        }}
      />
    </div>
  );
};

const FloatingDecorations = () => {
  // Smaller 3D Butterfly Configs (delicate & cute)
  const butterflies = [
    { id: 1, left: 12, duration: 19, delay: 0, scale: 0.45, type: 'crystal', flapSpeed: '0.28s' },
    { id: 2, left: 36, duration: 23, delay: 4, scale: 0.52, type: 'monarch', flapSpeed: '0.24s' },
    { id: 3, left: 66, duration: 21, delay: 2, scale: 0.42, type: 'crystal', flapSpeed: '0.30s' },
    { id: 4, left: 86, duration: 25, delay: 6, scale: 0.48, type: 'monarch', flapSpeed: '0.26s' },
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>

      {/* Soft Pastel Snowfall */}
      <Snowfall
        color="#ffb6c1"
        snowflakeCount={15}
        radius={[1, 2.5]}
        speed={[0.4, 0.9]}
        wind={[-0.3, 0.3]}
        style={{ position: 'fixed', width: '100vw', height: '100vh', opacity: 0.4 }}
      />

      {/* Floating Smaller 3D Butterflies */}
      {butterflies.map((b) => (
        <div
          key={b.id}
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: `${b.left}%`,
            animation: `fly3DTrajectory ${b.duration}s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
            animationDelay: `${b.delay}s`,
            opacity: 0.95
          }}
        >
          <IridescentButterfly3D scale={b.scale} speed={b.flapSpeed} type={b.type} />
        </div>
      ))}

      {/* Real Natural Grass Image Footer */}
      {/* <AnimatedGrassFooter /> */}

      <style>{`
        /* 3D Flapping Wing Animations */
        @keyframes flapLeft3D {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(-70deg);
          }
        }

        @keyframes flapRight3D {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(70deg);
          }
        }

        @keyframes shadowPulse {
          0% {
            transform: rotateX(75deg) scale(0.7);
            opacity: 0.2;
          }
          100% {
            transform: rotateX(75deg) scale(1.1);
            opacity: 0.4;
          }
        }

        /* Natural Ground-Rooted Wind Sway Physics */
        @keyframes swayGrassNatural1 {
          0% {
            transform: rotate(0deg) skewX(0deg);
          }
          100% {
            transform: rotate(2.5deg) skewX(1.8deg);
          }
        }

        @keyframes swayGrassNatural2 {
          0% {
            transform: rotate(0deg) skewX(0deg);
          }
          100% {
            transform: rotate(-3deg) skewX(-2.2deg);
          }
        }

        /* 3D Flight Trajectory Across Screen */
        @keyframes fly3DTrajectory {
          0% {
            transform: translateY(0px) translateX(0px) rotate(8deg);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          35% {
            transform: translateY(-35vh) translateX(50px) rotate(-12deg);
          }
          65% {
            transform: translateY(-70vh) translateX(-40px) rotate(15deg);
          }
          90% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(-115vh) translateX(30px) rotate(-8deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingDecorations;
