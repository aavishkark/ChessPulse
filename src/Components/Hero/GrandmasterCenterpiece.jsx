import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import gsap from "gsap";
import { Cpu, Activity, Zap } from "lucide-react";
import "./centerpiece.css";

const ARENA_HUD_META = {
  classic: {
    topChip: "DEPTH 22 NNUE",
    evalChip: "+1.35 WHITE",
    bottomChip: "18.4M NODES/S · CLASSICAL",
    accent: "#10b981",
  },
  blitz: {
    topChip: "LIVE WEBSOCKET TV",
    evalChip: "< 12MS STREAM",
    bottomChip: "2875 ELO · CYBER BLITZ",
    accent: "#a855f7",
  },
  gold: {
    topChip: "2,500+ GM TACTICS",
    evalChip: "MATE IN 3 FOUND",
    bottomChip: "99.4% ACCURACY · MASTER",
    accent: "#f59e0b",
  },
};

const GrandmasterCenterpiece = forwardRef(function GrandmasterCenterpiece(
  { currentArena },
  ref
) {
  const card3dRef = useRef(null);
  const imgRef = useRef(null);
  const switchSpinRef = useRef(0);

  useImperativeHandle(ref, () => ({
    triggerSpin: (onPeak) => {
      const el = imgRef.current;
      if (!el) return;

      const spinObj = { val: 0, blur: 0, scale: 1 };

      // Phase 1: Accelerate 0 -> 360 deg with motion blur
      gsap.to(spinObj, {
        val: 360,
        blur: 14,
        scale: 0.88,
        duration: 0.55,
        ease: "power2.in",
        onUpdate: () => {
          switchSpinRef.current = spinObj.val;
          el.style.filter = `blur(${spinObj.blur.toFixed(1)}px) drop-shadow(0 24px 38px rgba(0, 0, 0, 0.65))`;
          el.style.scale = `${spinObj.scale}`;
        },
        onComplete: () => {
          if (onPeak) onPeak();

          // Phase 2: Decelerate 360 -> 720 deg with spring settle
          gsap.to(spinObj, {
            val: 720,
            blur: 0,
            scale: 1,
            duration: 1.25,
            ease: "back.out(0.75)",
            onUpdate: () => {
              switchSpinRef.current = spinObj.val;
              el.style.filter = `blur(${spinObj.blur.toFixed(1)}px) drop-shadow(0 24px 38px rgba(0, 0, 0, 0.65))`;
              el.style.scale = `${spinObj.scale}`;
            },
            onComplete: () => {
              switchSpinRef.current = 0;
              el.style.filter = "drop-shadow(0 24px 38px rgba(0, 0, 0, 0.65))";
              el.style.scale = "1";
            },
          });
        },
      });
    },
  }));

  useEffect(() => {
    let mouse = { x: 0, y: 0 };
    let currentMouse = { x: 0, y: 0 };
    let animId;

    const handleMouseMove = (e) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      currentMouse.x += (mouse.x - currentMouse.x) * 0.06;
      currentMouse.y += (mouse.y - currentMouse.y) * 0.06;

      if (card3dRef.current) {
        const rotY = currentMouse.x * 28 + switchSpinRef.current;
        const rotX = -currentMouse.y * 18;
        card3dRef.current.style.transform = `rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const meta = ARENA_HUD_META[currentArena] || ARENA_HUD_META.blitz;

  return (
    <div className="centerpiece-stage-box">
      {/* Dynamic Ambient Aura */}
      <div className={`centerpiece-glow-aura aura-${currentArena}`} />

      {/* 3D Holographic Orbit Pedestal */}
      <div className="pedestal-disc" aria-hidden="true">
        <div className="pedestal-ring ring-outer" />
        <div className="pedestal-ring ring-inner" />
      </div>

      {/* Floating Glass Telemetry Chips (Zero Overlap) */}
      <div className="stage-hud-chip chip-top-left">
        <span className="chip-live-dot" style={{ background: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }} />
        <span>{meta.topChip}</span>
      </div>

      <div className="stage-hud-chip chip-top-right" style={{ borderColor: `${meta.accent}55`, color: meta.accent }}>
        <Activity size={13} />
        <span>{meta.evalChip}</span>
      </div>

      <div className="stage-hud-chip chip-bottom-right">
        <Cpu size={13} style={{ color: meta.accent }} />
        <span>{meta.bottomChip}</span>
      </div>

      {/* 3D Cursor-Tilting & 720-Spinning Board Sculpture */}
      <div className="centerpiece-3d-pivot" ref={card3dRef}>
        <div className="centerpiece-float-bob">
          <img
            ref={imgRef}
            src="/assets/hero.png"
            alt="ChessPulse 3D Grandmaster Board"
            className={`centerpiece-hero-img img-theme-${currentArena}`}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
});

export default GrandmasterCenterpiece;
