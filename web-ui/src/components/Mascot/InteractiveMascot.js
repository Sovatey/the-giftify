import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MASCOT_STATES, SPEECH_QUOTES, CLICK_REACTIONS } from './mascotTypes';
import { getViewportBounds, clampPosition, loadMascotPosition, saveMascotPosition, getRandomDestination } from './mascotMovement';
import './Mascot.css';

const InteractiveMascot = ({
  image = '/mascot_cat.png',
  sleepImage = '/mascot_cat_sleep.png',
  initialPosition = 'bottom-right',
  enableWalking = false,
  enableParticles = true
}) => {
  // Visible React State for low-frequency UI updates (speech bubble, active reaction CSS, particles)
  const [currentState, setCurrentState] = useState(MASCOT_STATES.IDLE);
  const [speechText, setSpeechText] = useState(null);
  const [reactionClass, setReactionClass] = useState('');
  const [facingLeft, setFacingLeft] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  // High-Frequency Refs for 60 FPS animation without causing React re-renders
  const containerRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef(MASCOT_STATES.IDLE);
  const animFrameRef = useRef(null);
  const autoTimeoutRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  // Update State Machine helper
  const changeState = useCallback((newState) => {
    stateRef.current = newState;
    setCurrentState(newState);
  }, []);

  // Update container DOM position directly for 60 FPS performance
  const applyTransform = useCallback((x, y, isFlipped = false) => {
    if (containerRef.current) {
      const flipScale = isFlipped ? 'scaleX(-1)' : 'scaleX(1)';
      containerRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) ${flipScale}`;
    }
  }, []);

  // Spawn temporary floating hearts / sparkles
  const triggerSparkle = useCallback(() => {
    if (!enableParticles) return;
    const newSparkle = {
      id: Date.now() + Math.random(),
      left: 20 + Math.random() * 60,
      symbol: Math.random() > 0.4 ? '💖' : '✨'
    };
    setSparkles(prev => [...prev.slice(-4), newSparkle]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
    }, 1200);
  }, [enableParticles]);

  // Main 60 FPS Animation Frame Loop
  useEffect(() => {
    // Load initial position from localStorage or calculate default bounds
    const initialPos = loadMascotPosition(initialPosition);
    posRef.current = initialPos;
    targetPosRef.current = initialPos;
    applyTransform(initialPos.x, initialPos.y, false);

    const updateFrame = () => {
      const state = stateRef.current;

      // Smooth Movement for WALKING / PLAYING states (only when enableWalking is true)
      if (enableWalking && (state === MASCOT_STATES.WALKING || state === MASCOT_STATES.PLAYING) && !isDraggingRef.current) {
        const dx = targetPosRef.current.x - posRef.current.x;
        const dy = targetPosRef.current.y - posRef.current.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 3) {
          // Calculate continuous movement step
          const speed = state === MASCOT_STATES.PLAYING ? 2.8 : 1.8;
          const vx = (dx / distance) * speed;
          const vy = (dy / distance) * speed;

          posRef.current.x += vx;
          posRef.current.y += vy;

          // Determine horizontal direction flip
          const isFlipped = vx < -0.1;
          setFacingLeft(isFlipped);
          applyTransform(posRef.current.x, posRef.current.y, isFlipped);
        } else {
          // Reached target destination smoothly
          posRef.current.x = targetPosRef.current.x;
          posRef.current.y = targetPosRef.current.y;
          applyTransform(posRef.current.x, posRef.current.y, facingLeft);
          changeState(MASCOT_STATES.IDLE);
        }
      }

      animFrameRef.current = requestAnimationFrame(updateFrame);
    };

    animFrameRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [applyTransform, changeState, enableWalking, facingLeft, initialPosition]);

  // Handle Window Resize to keep mascot strictly inside viewport bounds
  useEffect(() => {
    const handleResize = () => {
      const bounds = getViewportBounds();
      const clamped = clampPosition(posRef.current.x, posRef.current.y, bounds);
      posRef.current = clamped;
      targetPosRef.current = clamped;
      applyTransform(clamped.x, clamped.y, facingLeft);
      saveMascotPosition(clamped.x, clamped.y);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyTransform, facingLeft]);

  // Autonomous Behavior Loop (IDLE -> SIT -> SLEEP in place when enableWalking is false)
  const scheduleNextAutonomousBehavior = useCallback(() => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);

    const randomDelay = 4000 + Math.random() * 6000; // 4s - 10s random idle time

    autoTimeoutRef.current = setTimeout(() => {
      // Priority check: do not trigger autonomous behaviors while dragging or reacting
      if (
        isDraggingRef.current ||
        stateRef.current === MASCOT_STATES.DRAGGING ||
        stateRef.current === MASCOT_STATES.REACTING ||
        stateRef.current === MASCOT_STATES.HOVERING
      ) {
        scheduleNextAutonomousBehavior();
        return;
      }

      // Pick next random behavior ensuring non-repetitive sequence
      const behaviors = enableWalking
        ? [MASCOT_STATES.IDLE, MASCOT_STATES.WALKING, MASCOT_STATES.SITTING, MASCOT_STATES.PLAYING, MASCOT_STATES.SLEEPING]
        : [MASCOT_STATES.IDLE, MASCOT_STATES.SITTING, MASCOT_STATES.SLEEPING];

      // Filter out current state to ensure variety
      const available = behaviors.filter(b => b !== stateRef.current);
      const nextBehavior = available[Math.floor(Math.random() * available.length)];

      if (enableWalking && (nextBehavior === MASCOT_STATES.WALKING || nextBehavior === MASCOT_STATES.PLAYING)) {
        const dest = getRandomDestination(posRef.current.x, posRef.current.y);
        targetPosRef.current = dest;
      }

      changeState(nextBehavior);
      scheduleNextAutonomousBehavior();
    }, randomDelay);
  }, [changeState, enableWalking]);

  // Start Autonomous behavior loop on mount
  useEffect(() => {
    scheduleNextAutonomousBehavior();
    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    };
  }, [scheduleNextAutonomousBehavior]);

  // Trigger Speech Bubble Popup
  const showSpeechBubble = (text) => {
    setSpeechText(text);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeechText(null);
    }, 2500);
  };

  // POINTER EVENTS FOR DRAGGING (Mouse & Mobile Touch Support)
  const handlePointerDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

    dragOffsetRef.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y
    };

    changeState(MASCOT_STATES.DRAGGING);
    if (e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        // Fallback for older browsers
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;

    const bounds = getViewportBounds();
    const rawX = e.clientX - dragOffsetRef.current.x;
    const rawY = e.clientY - dragOffsetRef.current.y;

    const clamped = clampPosition(rawX, rawY, bounds);
    posRef.current = clamped;
    targetPosRef.current = clamped;

    applyTransform(clamped.x, clamped.y, facingLeft);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    saveMascotPosition(posRef.current.x, posRef.current.y);

    const dist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );

    // If movement distance < 6px, treat as a CLICK reaction!
    if (dist < 6) {
      handleMascotClick();
    } else {
      // Re-initialize state to IDLE after drag release
      changeState(MASCOT_STATES.IDLE);
    }

    if (e.target.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Fallback
      }
    }
  };

  // CLICK REACTION HANDLER
  const handleMascotClick = () => {
    changeState(MASCOT_STATES.REACTING);
    triggerSparkle();

    // Pick random click reaction CSS animation
    const randomReaction = CLICK_REACTIONS[Math.floor(Math.random() * CLICK_REACTIONS.length)];
    setReactionClass(`react-${randomReaction}`);

    // Pick random cute quote
    const randomQuote = SPEECH_QUOTES[Math.floor(Math.random() * SPEECH_QUOTES.length)];
    showSpeechBubble(randomQuote);

    // Return to IDLE state after reaction finishes
    setTimeout(() => {
      setReactionClass('');
      changeState(MASCOT_STATES.IDLE);
    }, 1200);
  };

  // HOVER HANDLERS
  const handlePointerEnter = () => {
    if (
      isDraggingRef.current ||
      stateRef.current === MASCOT_STATES.DRAGGING ||
      stateRef.current === MASCOT_STATES.REACTING
    ) {
      return;
    }
    triggerSparkle();
    changeState(MASCOT_STATES.HOVERING);
  };

  const handlePointerLeave = () => {
    if (stateRef.current === MASCOT_STATES.HOVERING) {
      changeState(MASCOT_STATES.IDLE);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`mascot-container ${isDraggingRef.current ? 'is-dragging' : ''} ${
        currentState === MASCOT_STATES.HOVERING ? 'is-hovered' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Speech Bubble Popup */}
      {speechText && <div className="mascot-speech-bubble">{speechText}</div>}

      {/* Floating Sparkle / Heart Particles */}
      {sparkles.map((sp) => (
        <span key={sp.id} className="floating-sparkle" style={{ left: `${sp.left}%` }}>
          {sp.symbol}
        </span>
      ))}

      {/* Sleeping "Z" Particles */}
      {currentState === MASCOT_STATES.SLEEPING && (
        <div className="floating-z-particles">
          <span className="z-particle">Z</span>
          <span className="z-particle">z</span>
          <span className="z-particle">Z</span>
        </div>
      )}

      {/* Mascot Character Image (switches to sleepImage when sleeping) */}
      <div className={`mascot-character state-${currentState.toLowerCase()} ${reactionClass}`}>
        <img
          src={currentState === MASCOT_STATES.SLEEPING ? sleepImage : image}
          alt="Virtual Pet Mascot"
          className="mascot-img"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default InteractiveMascot;
