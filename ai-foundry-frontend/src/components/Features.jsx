import { motion } from 'framer-motion'
import { Brain, Globe, Share2 } from 'lucide-react'
import FeatureCard from './FeatureCard'
import React, { useEffect, useRef, useState, useMemo } from 'react'

const Features = ({ onPositionsCalculated, onAllClicked, onScrollLockChange }) => {
  const gridRef = useRef(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [clickedCards, setClickedCards] = useState(new Set())
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  // Detect when Features section is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.75) {
            setIsVisible(true)
          } else {
            setIsVisible(false)
          }
        })
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  // Notify parent about scroll lock state - only when section is visible
  useEffect(() => {
    if (onScrollLockChange) {
      onScrollLockChange(isVisible && clickedCards.size < 3)
    }
  }, [clickedCards.size, onScrollLockChange, isVisible])

  const features = useMemo(
    () => [
      {
        icon: Brain,
        title: 'AI Breakdown',
        description:
          'Intelligent analysis that transforms your big idea into structured, actionable steps with comprehensive BRD/PRD (Business Requirements Document/Product Requirements Document) generation',
      },
      {
        icon: Globe,
        title: 'Website Generation',
        description:
          "Professional websites created instantly, tailored to your startup's needs. Generate modern, responsive designs with optimized layouts, compelling copy, and seamless user experience. From landing pages to full multi-page sites, get production-ready code in minutes with built-in SEO best practices and mobile-first design.",
      },
      {
        icon: Share2,
        title: 'Marketing',
        description:
          'Auto-post engaging content to Instagram and Twitter with AI-generated visuals and copy. Integrated call management system for customer engagement with smart routing and automated responses.',
      },
    ],
    []
  )

  const totalFeatures = features.length
  const progress = clickedCards.size / totalFeatures

  // Calculate positions of first 3 feature cards for sphere morphing
  useEffect(() => {
    if (gridRef.current && onPositionsCalculated) {
      const calculatePositions = () => {
        const cards = gridRef.current.querySelectorAll('.feature-card')
        const positions = Array.from(cards)
          .slice(0, 3)
          .map((card) => {
            const rect = card.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2 - window.innerWidth / 2
            const centerY =
              rect.top + rect.height / 2 - window.innerHeight / 2

            return {
              x: centerX / 100, // Normalize for Three.js scale
              y: -centerY / 100,
              z: 0,
            }
          })
        onPositionsCalculated(positions)
      }

      calculatePositions()
      window.addEventListener('resize', calculatePositions)
      return () => window.removeEventListener('resize', calculatePositions)
    }
  }, [onPositionsCalculated])

  const handleCardClick = (index) => {
    setExpandedCard((prev) => (prev === index ? null : index))

    setClickedCards((prev) => {
      if (prev.has(index)) return prev
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  const handleScrollButtonClick = () => {
    // Only trigger scroll if all cards are clicked
    if (clickedCards.size === features.length && typeof onAllClicked === 'function') {
      onAllClicked()
    }
  }

  return (
    <section
      ref={sectionRef}
      id="features"
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gray-50 relative flex items-start"
    >
      <div className="container mx-auto mt-0 relative">
        {/* DIV 1: CARDS ON TOP */}
        <div
          ref={gridRef}
          className="relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-9"
        >
          {features.map((feature, index) => (
            <div key={feature.title} className="feature-card relative">
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
                isExpanded={expandedCard === index}
                onToggle={() => handleCardClick(index)}
              />
              {!clickedCards.has(index) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
                >
                  <p className="text-purple-600 text-sm font-semibold">
                    Click the card
                  </p>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* DIV 2: SVG PIPELINES (BEHIND) + SCROLL BUTTON */}
        <div className="relative mt-16 flex flex-col items-center z-10">
          {/* SVG pipelines - shorter, separate, ending around/behind button */}
          <div className="absolute -top-20 left-0 right-0 flex justify-center -z-10 pointer-events-none">
            <svg
              viewBox="0 0 1000 220"
              className="w-full max-w-5xl h-52"
            >
              <defs>
                {/* base line gradient */}
                <linearGradient id="pipeBase" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
                </linearGradient>

                {/* glow gradient */}
                <linearGradient id="pipeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* Base pipes: all start at same height, end separately near button */}
              {/* Left pipe */}
              <path
                d="M0 0 V110 H430"
                stroke="url(#pipeBase)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              {/* Middle pipe */}
              <path
                d="M500 0 V110 H0"
                stroke="url(#pipeBase)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              {/* Right pipe */}
              <path
                d="M1000 0 V110 H570"
                stroke="url(#pipeBase)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />

              {/* Glowing strokes that draw when card is clicked */}
              {/* LEFT */}
              <motion.path
                d="M0 0 V110 H430"
                stroke="url(#pipeGlow)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                pathLength={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  clickedCards.has(0)
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                className="drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]"
              />

              {/* MIDDLE */}
              <motion.path
                d="M500 0 V110 H0"
                stroke="url(#pipeGlow)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                pathLength={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  clickedCards.has(1)
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{ duration: 0.7, ease: 'easeInOut' }}
                className="drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]"
              />

              {/* RIGHT */}
              <motion.path
                d="M1000 0 V110 H570"
                stroke="url(#pipeGlow)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                pathLength={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  clickedCards.has(2)
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                className="drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]"
              />
            </svg>
          </div>

          {/* SCROLL BUTTON with fill based on progress – closer to cards */}
          <button
            type="button"
            onClick={handleScrollButtonClick}
            className="relative mt-2 px-8 py-3 rounded-full border border-cyan-400/60 bg-slate-950/80 text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase text-cyan-100 shadow-[0_0_30px_rgba(59,130,246,0.65)] overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 opacity-90"
              style={{ originX: 0 }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress }}
              transition={{delay:0.8, duration: 0.5, ease: 'easeOut' }}
            />
            <span className="relative z-10">Scroll</span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default Features
