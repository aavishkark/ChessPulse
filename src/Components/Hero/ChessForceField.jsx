import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import gsap from "gsap";
import { StauntonPiece } from "./ChessPiecesSVG";
import "./chessforcefield.css";

const PIECES_CONFIG = [
  // Foreground pieces (framing the hero & 3D stage)
  { id: "cp1", type: "knight", className: "cp-item cp-fg cp1", isFg: true },
  { id: "cp2", type: "queen", className: "cp-item cp-fg cp2", isFg: true },
  { id: "cp3", type: "king", className: "cp-item cp-fg cp3", isFg: true },
  { id: "cp4", type: "bishop", className: "cp-item cp-fg cp4", isFg: true },
  { id: "cp5", type: "rook", className: "cp-item cp-fg cp5", isFg: true },
  { id: "cp6", type: "pawn", className: "cp-item cp-fg cp6", isFg: true },
  // Background depth pieces (soft blur, inverse parallax)
  { id: "cp7", type: "knight", className: "cp-item cp-bg cp7", isFg: false },
  { id: "cp8", type: "bishop", className: "cp-item cp-bg cp8", isFg: false },
  { id: "cp9", type: "pawn", className: "cp-item cp-bg cp9", isFg: false },
  { id: "cp10", type: "rook", className: "cp-item cp-bg cp10", isFg: false },
];

const ChessForceField = forwardRef(function ChessForceField({ currentArena }, ref) {
  const fgRef = useRef(null);
  const bgRef = useRef(null);
  const pieceElsRef = useRef([]);
  const isSwitchingRef = useRef(false);

  // Unified state objects for each piece (rAF is the sole DOM writer)
  const statesRef = useRef(
    PIECES_CONFIG.map((_, i) => ({
      baseX: 0,
      baseY: 0,
      rx: 0,
      ry: 0,
      angle: (i * 37) % 360,
      scale: 1,
      opacity: PIECES_CONFIG[i].isFg ? 0.88 : 0.38,
    }))
  );

  useImperativeHandle(ref, () => ({
    triggerSwitch: (arenaId, onPeak) => {
      if (isSwitchingRef.current) return;
      isSwitchingRef.current = true;

      const hero = document.querySelector(".hero-section");
      if (!hero) {
        isSwitchingRef.current = false;
        return;
      }

      const heroRect = hero.getBoundingClientRect();
      // Target implode point: center of the right-hand 3D stage (or screen center on mobile)
      const stageEl = document.querySelector(".centerpiece-stage-box");
      const stageRect = stageEl ? stageEl.getBoundingClientRect() : null;

      const implodeTargetX = stageRect
        ? stageRect.left - heroRect.left + stageRect.width / 2
        : heroRect.width * 0.68;
      const implodeTargetY = stageRect
        ? stageRect.top - heroRect.top + stageRect.height / 2
        : heroRect.height * 0.42;

      let completedCount = 0;
      const total = PIECES_CONFIG.length;
      let peakCalled = false;

      statesRef.current.forEach((st, i) => {
        const el = pieceElsRef.current[i];
        if (!el) {
          completedCount++;
          return;
        }

        const anchorX = el.offsetLeft + el.offsetWidth / 2;
        const anchorY = el.offsetTop + el.offsetHeight / 2;

        const deltaX = implodeTargetX - anchorX;
        const deltaY = implodeTargetY - anchorY;

        const nextBaseX = (Math.random() - 0.5) * 90;
        const nextBaseY = (Math.random() - 0.5) * 90;
        const targetOpacity = PIECES_CONFIG[i].isFg ? 0.88 : 0.38;

        const tl = gsap.timeline();

        // 1. Implode into 3D stage center
        tl.to(st, {
          baseX: deltaX,
          baseY: deltaY,
          rx: 0,
          ry: 0,
          angle: st.angle + 120,
          scale: 0.08,
          opacity: 0,
          duration: 0.48,
          ease: "power2.in",
          onComplete: () => {
            if (!peakCalled) {
              peakCalled = true;
              if (onPeak) onPeak();
            }
          },
        })
          .to(st, { duration: 0.18 })
          // 2. Explode outward to new tactical coordinates
          .to(st, {
            baseX: nextBaseX,
            baseY: nextBaseY,
            angle: st.angle + 240,
            scale: 1,
            opacity: targetOpacity,
            duration: 0.85,
            ease: "back.out(1.55)",
            onComplete: () => {
              completedCount++;
              if (completedCount >= total) {
                isSwitchingRef.current = false;
              }
            },
          });
      });
    },
  }));

  useEffect(() => {
    let mouse = { x: 0, y: 0, px: -9999, py: -9999 };
    let currentMouse = { x: 0, y: 0 };
    let animId;

    const handleMouseMove = (e) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      mouse.px = e.clientX;
      mouse.py = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.px = -9999;
      mouse.py = -9999;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      const time = performance.now() * 0.001;

      currentMouse.x += (mouse.x - currentMouse.x) * 0.06;
      currentMouse.y += (mouse.y - currentMouse.y) * 0.06;

      // Multi-layer container parallax
      if (fgRef.current) {
        fgRef.current.style.transform = `translate3d(${currentMouse.x * 36}px, ${currentMouse.y * 36}px, 0)`;
      }
      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(${currentMouse.x * -22}px, ${currentMouse.y * -22}px, 0)`;
      }

      const hero = document.querySelector(".hero-section");
      const heroRect = hero ? hero.getBoundingClientRect() : { left: 0, top: 0 };

      statesRef.current.forEach((st, i) => {
        const el = pieceElsRef.current[i];
        if (!el) return;

        const dur = [6, 7.5, 6.8, 8.2, 7.1, 6.4, 9.2, 10.5, 8.8, 11.2][i % 10];
        const phase = (time + i * 0.9) * ((Math.PI * 2) / dur);
        const floatY = Math.sin(phase) * 12;
        const floatX = Math.cos(phase * 0.7) * 6;
        const floatAngle = Math.cos(phase) * 5;

        if (!isSwitchingRef.current) {
          // Measure distance from static anchor + base offset (eliminates feedback jitter)
          const anchorScreenX =
            heroRect.left + el.offsetLeft + el.offsetWidth / 2 + st.baseX;
          const anchorScreenY =
            heroRect.top + el.offsetTop + el.offsetHeight / 2 + st.baseY;

          const diffX = mouse.px - anchorScreenX;
          const diffY = mouse.py - anchorScreenY;
          const distance = Math.sqrt(diffX * diffX + diffY * diffY);

          let targetRx = 0;
          let targetRy = 0;
          let speedMult = 1;

          const radius = 320;
          if (distance < radius && distance > 1) {
            const force = (radius - distance) / radius;
            targetRx = (diffX / distance) * force * -85;
            targetRy = (diffY / distance) * force * -85;
            speedMult = 1 + force * 4;
          }

          st.rx += (targetRx - st.rx) * 0.09;
          st.ry += (targetRy - st.ry) * 0.09;
          st.angle += 0.18 * speedMult;
        }

        const totalX = st.baseX + st.rx + floatX;
        const totalY = st.baseY + st.ry + floatY;
        const totalRot = st.angle + floatAngle;

        el.style.transform = `translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0) rotate(${totalRot.toFixed(2)}deg) scale(${st.scale.toFixed(3)})`;
        el.style.opacity = st.opacity;
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Deep Background Parallax Layer */}
      <div className="chess-pieces-container-bg" ref={bgRef} aria-hidden="true">
        {PIECES_CONFIG.map((p, idx) => {
          if (p.isFg) return null;
          return (
            <div
              key={p.id}
              ref={(el) => (pieceElsRef.current[idx] = el)}
              className={`${p.className} theme-${currentArena}`}
            >
              <StauntonPiece type={p.type} arena={currentArena} uid={p.id} />
            </div>
          );
        })}
      </div>

      {/* Foreground Interactive Force-Field Layer */}
      <div className="chess-pieces-container-fg" ref={fgRef} aria-hidden="true">
        {PIECES_CONFIG.map((p, idx) => {
          if (!p.isFg) return null;
          return (
            <div
              key={p.id}
              ref={(el) => (pieceElsRef.current[idx] = el)}
              className={`${p.className} theme-${currentArena}`}
            >
              <StauntonPiece type={p.type} arena={currentArena} uid={p.id} />
            </div>
          );
        })}
      </div>
    </>
  );
});

export default ChessForceField;
