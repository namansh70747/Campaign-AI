import React, { useRef, useState, useEffect } from "react";
import { Button } from "./ButtonPrompt";
import { Paperclip, Plus, Mic, ArrowUp } from "lucide-react";
import gsap from "gsap";

const PromptInput = ({ onSubmit, isRunning }) => {
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Remove opacity fades to prevent "invisible" flicker; animate transform only
      gsap.killTweensOf(containerRef.current);
      gsap.set(containerRef.current, { y: 16 });
      const tween = gsap.to(containerRef.current, {
        y: 0,
        duration: 0.8,
        delay: 0.1,
        ease: "power3.out",
        overwrite: "auto",
      });
      return () => tween.kill();
    }
  }, []);

  const handleSubmit = () => {
    if (!isRunning && inputValue.trim()) {
      console.log("Submitted:", inputValue);
      if (onSubmit) onSubmit(inputValue.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
  <div ref={containerRef} className="w-full max-w-3xl mx-auto px-4 will-change-transform">
      <div className="relative group">
        {/* larger blurred gradient ring visible on hover */}
        <div
          className="absolute -inset-6 rounded-3xl opacity-0 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none blur-3xl z-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(45,55,240,0.18) 0%, rgba(96,165,250,0.14) 40%, rgba(236,72,153,0.12) 100%)",
            boxShadow:
              "0 20px 60px rgba(45,55,240,0.06), 0 10px 30px rgba(236,72,153,0.04)",
          }}
        />

        {/* Solid dark inner card */}
        <div className="relative bg-[#0b1116] border border-[#111820] rounded-3xl shadow-xl overflow-hidden z-10">
          <div className="flex items-center gap-3 p-4">
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 rounded-full h-10 w-10 hover:bg-white/3 transition-colors"
            >
              <Plus className="h-5 w-5 text-gray-400" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 rounded-full h-10 w-10 hover:bg-white/3 transition-colors"
            >
              <Paperclip className="h-5 w-5 text-gray-400" />
            </Button>

            <div className="flex-1 min-h-12 flex items-center">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI agent to create something..."
                className="w-full bg-transparent border-none outline-none resize-none text-gray-200 placeholder:text-gray-400 text-base leading-relaxed py-3 max-h-40"
                rows={1}
                style={{
                  height: "auto",
                  minHeight: "3rem",
                }}
                onInput={(e) => {
                  const target = e.target;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 rounded-full h-10 w-10 hover:bg-white/3 transition-colors"
            >
              <Mic className="h-5 w-5 text-gray-400" />
            </Button>

            {/* Submit (Run Foundry) mapped here; shows spinner when running */}
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isRunning}
              className="shrink-0 rounded-full h-10 w-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
              aria-busy={isRunning ? "true" : "false"}
              aria-label={isRunning ? "Running..." : "Submit prompt"}
            >
              {isRunning ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
