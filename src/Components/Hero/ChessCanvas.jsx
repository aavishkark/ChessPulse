import React, { useEffect, useRef } from "react";

export default function ChessCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Track mouse
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const parent = canvas.parentElement;
    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseleave", handleMouseLeave);

    // Grid nodes (8x8 chess-inspired sparse network)
    const cols = 12;
    const rows = 8;
    const nodes = [];

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        nodes.push({
          baseX: (i / (cols - 1)) * 1.1 - 0.05,
          baseY: (j / (rows - 1)) * 1.1 - 0.05,
          x: 0,
          y: 0,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark") ||
        document.body.getAttribute("data-theme") === "dark" ||
        !document.documentElement.classList.contains("light");

      const nodeColor = isDark ? "rgba(139, 92, 246, 0.4)" : "rgba(124, 58, 237, 0.25)";
      const lineColor = isDark ? "rgba(6, 182, 212, 0.12)" : "rgba(2, 132, 199, 0.08)";
      const activeLineColor = isDark ? "rgba(139, 92, 246, 0.35)" : "rgba(124, 58, 237, 0.25)";

      // Update positions
      nodes.forEach((n) => {
        const px = n.baseX * width + Math.sin(time + n.pulse) * 8;
        const py = n.baseY * height + Math.cos(time + n.pulse) * 8;

        // Push away from mouse slightly
        if (mouse.active) {
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 0) {
            const force = (1 - dist / 180) * 20;
            n.x = px + (dx / dist) * force;
            n.y = py + (dy / dist) * force;
          } else {
            n.x = px;
            n.y = py;
          }
        } else {
          n.x = px;
          n.y = py;
        }
      });

      // Draw subtle connecting lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);

            // If close to cursor, highlight
            let isNearMouse = false;
            if (mouse.active) {
              const mx = (nodes[i].x + nodes[j].x) / 2 - mouse.x;
              const my = (nodes[i].y + nodes[j].y) / 2 - mouse.y;
              if (Math.sqrt(mx * mx + my * my) < 140) {
                isNearMouse = true;
              }
            }

            ctx.strokeStyle = isNearMouse ? activeLineColor : lineColor;
            ctx.lineWidth = isNearMouse ? 1.2 : 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw node dots
      nodes.forEach((n) => {
        let radius = 1.8;
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            radius = 2.8 * (1 - dist / 140) + 1.8;
          }
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.75,
      }}
      aria-hidden="true"
    />
  );
}
