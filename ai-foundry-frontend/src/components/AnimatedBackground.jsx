import React, { useEffect, useRef } from "react";

const AnimatedBackground = ({ theme = "dark" }) => {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let rafId = null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // choose palettes based on theme
    const isDark = theme === "dark";

    const blobs = (isDark ? [
      { x: 0.2, y: 0.3, radius: 0.4, color: "hsl(217, 91%, 25%)", vx: 0, vy: 0 },
      { x: 0.8, y: 0.4, radius: 0.35, color: "hsl(217, 71%, 35%)", vx: 0, vy: 0 },
      { x: 0.5, y: 0.7, radius: 0.45, color: "hsl(25, 95%, 53%)", vx: 0, vy: 0 },
      { x: 0.3, y: 0.8, radius: 0.3, color: "hsl(0, 84%, 60%)", vx: 0, vy: 0 },
      { x: 0.7, y: 0.9, radius: 0.35, color: "hsl(330, 81%, 60%)", vx: 0, vy: 0 },
    ] : [
      // light/pastel but more vibrant variants for visibility on white
      { x: 0.2, y: 0.3, radius: 0.44, color: "hsl(215, 90%, 60%)", vx: 0, vy: 0 }, // vivid blue
      { x: 0.8, y: 0.4, radius: 0.38, color: "hsl(190, 85%, 60%)", vx: 0, vy: 0 }, // teal
      { x: 0.5, y: 0.7, radius: 0.5,  color: "hsl(14, 90%, 60%)", vx: 0, vy: 0 }, // orange
      { x: 0.3, y: 0.8, radius: 0.33, color: "hsl(350, 85%, 60%)", vx: 0, vy: 0 }, // warm pink
      { x: 0.7, y: 0.9, radius: 0.38, color: "hsl(290, 75%, 60%)", vx: 0, vy: 0 }, // purple
    ]);

    // Mouse move handler
    const handleMouseMove = (e) => {
      targetPos.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Smooth mouse position interpolation
      mousePos.current.x += (targetPos.current.x - mousePos.current.x) * 0.05;
      mousePos.current.y += (targetPos.current.y - mousePos.current.y) * 0.05;

      // Clear canvas with theme-appropriate background
      ctx.fillStyle = isDark ? "hsl(220, 30%, 8%)" : "hsl(210, 70%, 98%)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw blobs
      blobs.forEach((blob, index) => {
        const parallaxStrength = (isDark ? 0.03 : 0.025) * (index + 1);
        const offsetX = (mousePos.current.x - 0.5) * parallaxStrength;
        const offsetY = (mousePos.current.y - 0.5) * parallaxStrength;

        // Floating movement
        blob.vx += Math.sin(Date.now() * 0.0005 + index) * 0.00012;
        blob.vy += Math.cos(Date.now() * 0.0005 + index) * 0.00012;

        blob.x += blob.vx;
        blob.y += blob.vy;

        if (blob.x < 0.05 || blob.x > 0.95) blob.vx *= -1;
        if (blob.y < 0.05 || blob.y > 0.95) blob.vy *= -1;

        blob.vx *= 0.95;
        blob.vy *= 0.95;

        const x = (blob.x + offsetX) * canvas.width;
        const y = (blob.y + offsetY) * canvas.height;
        // make light blobs slightly larger for visibility
        const radius = blob.radius * Math.min(canvas.width, canvas.height) * (isDark ? 1 : 1.12);

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

        // stronger alpha stops for light theme so colors show well against white
        const alphaStart = isDark ? 0.6 : 0.95;
        const alphaMid = isDark ? 0.3 : 0.55;

        gradient.addColorStop(
          0,
          blob.color.replace(")", `, ${alphaStart})`).replace("hsl", "hsla")
        );
        gradient.addColorStop(
          0.5,
          blob.color.replace(")", `, ${alphaMid})`).replace("hsl", "hsla")
        );
        gradient.addColorStop(
          1,
          blob.color.replace(")", ", 0)").replace("hsl", "hsla")
        );

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      rafId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
    // re-run when theme changes so blobs/background update
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
      style={{ filter: theme === "dark" ? "blur(80px)" : "blur(40px)" }}
    />
  );
};

export default AnimatedBackground;
