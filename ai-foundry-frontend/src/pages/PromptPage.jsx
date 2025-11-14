import { useEffect, useRef, useState } from "react";
import AnimatedBackground from "../components/AnimatedBackground";
import PromptInput from "../components/PromptInput";
import gsap from "gsap";
import React from "react";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const navigate = useNavigate();
  const wsRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved;
    } catch {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    // Avoid opacity animations to prevent brief invisibility on first paint/StrictMode
    const tl = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } });
    if (titleRef.current) {
      gsap.set(titleRef.current, { y: 24 });
      tl.to(titleRef.current, { y: 0, duration: 0.8 });
    }
    if (subtitleRef.current) {
      gsap.set(subtitleRef.current, { y: 16 });
      tl.to(subtitleRef.current, { y: 0, duration: 0.7 }, "-=0.4");
    }
    return () => tl.kill();
  }, []);

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    // Connect WebSocket on mount
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const [running, setRunning] = useState(false);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws_stream_campaign');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
    }
  };

  // Send prompt to backend and navigate to report page
  const sendPrompt = (text) => {
    const promptText = text?.trim();
    if (!promptText) return;
    
    const ws = wsRef.current;
    
    // Check WebSocket connection
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      console.log('WebSocket not connected, attempting to reconnect...');
      connectWebSocket();
      setTimeout(() => sendPrompt(text), 1000);
      return;
    } else if (ws.readyState !== WebSocket.OPEN) {
      alert('Connecting to server. Please wait a moment and try again.');
      return;
    }
    
    setRunning(true);
    
    // Send prompt to backend
    ws.send(JSON.stringify({ initial_prompt: promptText }));
    console.log('Prompt sent to backend:', promptText);
    
    // Navigate to report page with the prompt
    setTimeout(() => {
      navigate('/workflow', { state: { prompt: promptText, autoStart: true } });
    }, 300);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <AnimatedBackground theme={theme} />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            title="Toggle theme"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-black/20 hover:opacity-95 transition"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-gray-700" />}
            <span className="hidden sm:inline text-sm text-gray-800 dark:text-gray-200">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>

        <div className="text-center mb-12 space-y-4">
          <h1
            ref={titleRef}
            className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight flex items-center justify-center flex-wrap ${
              theme === "light" ? "text-gray-900" : "text-foreground"
            }`}
          >
            <span>Lets Build</span>
            <span className="bg-linear-to-r from-red-100 via-accent to-pink-500 bg-clip-text text-transparent">
              Your Start-up
            </span>
          </h1>
          
          <p
            ref={subtitleRef}
            className={`text-lg md:text-xl max-w-2xl mx-auto ${
              theme === "light" ? "text-gray-600" : "text-muted-foreground"
            }`}
          >
            Lets initailise your starup and get ready to deploy
          </p>
        </div>

        <PromptInput onSubmit={sendPrompt} isRunning={running} />
        
        <div className="mt-8 text-sm text-muted-foreground/60">
          Press <kbd className="px-2 py-1 bg-secondary/50 rounded text-xs">Enter</kbd> to send or{" "}
          <kbd className="px-2 py-1 bg-secondary/50 rounded text-xs">Shift + Enter</kbd> for new line
        </div>
      </div>
    </div>
  );
};

export default Index;