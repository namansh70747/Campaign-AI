import React, { useEffect, useRef, useMemo } from 'react'
import { Brain, Globe, Share2 } from 'lucide-react'
import FeatureCard from './FeatureCard'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Features = ({ onPositionsCalculated, onAllClicked }) => {
  const gridRef = useRef(null)
  const sectionRef = useRef(null)
  const leftPathRef = useRef(null)
  const middlePathRef = useRef(null)
  const rightPathRef = useRef(null)
  const buttonFillRef = useRef(null)
  const scrollButtonRef = useRef(null)

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

  // Calculate positions of first 3 feature cards for any external usage
  useEffect(() => {
    if (gridRef.current && onPositionsCalculated) {
      const calculatePositions = () => {
        const cards = gridRef.current.querySelectorAll('.feature-card')
        const positions = Array.from(cards)
          .slice(0, 3)
          .map((card) => {
            const rect = card.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2 - window.innerWidth / 2
            const centerY = rect.top + rect.height / 2 - window.innerHeight / 2
            return { x: centerX / 100, y: -centerY / 100, z: 0 }
          })
        onPositionsCalculated(positions)
      }
      calculatePositions()
      window.addEventListener('resize', calculatePositions)
      return () => window.removeEventListener('resize', calculatePositions)
    }
  }, [onPositionsCalculated])

  // Scroll-driven sequential pipe fill & button fill (pinned section)
  useEffect(() => {
    if (!sectionRef.current) return

    const left = leftPathRef.current
    const middle = middlePathRef.current
    const right = rightPathRef.current
    const fill = buttonFillRef.current
    const button = scrollButtonRef.current

    if (!left || !middle || !right || !fill || !button) return

    // Use gsap.context so selectors are scoped and React-safe
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.feature-card')

      if (cards.length < 3) {
        console.warn('Expected 3 feature cards, found:', cards.length)
        return
      }

      const card0 = cards[0]
      const card1 = cards[1]
      const card2 = cards[2]

      const icon0 = card0.querySelector('.icon-animate')
      const icon1 = card1.querySelector('.icon-animate')
      const icon2 = card2.querySelector('.icon-animate')

      const iconTitleContainer0 = card0.querySelector('.icon-title-container')
      const iconTitleContainer1 = card1.querySelector('.icon-title-container')
      const iconTitleContainer2 = card2.querySelector('.icon-title-container')

      const desc0 = card0.querySelector('.card-description')
      const desc1 = card1.querySelector('.card-description')
      const desc2 = card2.querySelector('.card-description')

      // Pulsing button until progress complete
      const pulseTween = gsap.to(button, {
        scale: 1.02,
        duration: 1.2,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
      })

      // Prepare stroke animations for pipes
      const preparePath = (p) => {
        const len = p.getTotalLength()
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 })
        return len
      }
      preparePath(left)
      preparePath(middle)
      preparePath(right)
      gsap.set(fill, { scaleX: 0, transformOrigin: 'left' })

      // Disable CSS animations on icons initially
      if (icon0) gsap.set(icon0, { opacity: 0.3 })
      if (icon1) gsap.set(icon1, { opacity: 0.3 })
      if (icon2) gsap.set(icon2, { opacity: 0.3 })

      const prepareIcon = (iconContainer, gradId, linecap = 'round') => {
  if (!iconContainer) return { paths: [] }

  const svg =
    iconContainer.tagName?.toLowerCase() === 'svg'
      ? iconContainer
      : iconContainer.querySelector('svg')

  if (!svg) return { paths: [] }

  // inject gradient once
  if (!svg.querySelector(`#${gradId}`)) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const lg = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    lg.setAttribute('id', gradId)
    lg.setAttribute('x1', '0%')
    lg.setAttribute('y1', '0%')
    lg.setAttribute('x2', '100%')
    lg.setAttribute('y2', '100%')

    ;[
      { offset: '0%', color: '#22d3ee' },
      { offset: '50%', color: '#38bdf8' },
      { offset: '100%', color: '#a855f7' },
    ].forEach((s) => {
      const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stopEl.setAttribute('offset', s.offset)
      stopEl.setAttribute('stop-color', s.color)
      lg.appendChild(stopEl)
    })

    defs.appendChild(lg)
    svg.insertBefore(defs, svg.firstChild)
  }

  const drawableSelectors = 'path,line,polyline,polygon,circle,rect,ellipse'
  const paths = Array.from(svg.querySelectorAll(drawableSelectors))

  paths.forEach((path) => {
    let length = 500

    try {
      if (typeof path.getTotalLength === 'function') {
        length = path.getTotalLength()
      } else if (path.tagName.toLowerCase() === 'line') {
        const x1 = parseFloat(path.getAttribute('x1') || 0)
        const y1 = parseFloat(path.getAttribute('y1') || 0)
        const x2 = parseFloat(path.getAttribute('x2') || 0)
        const y2 = parseFloat(path.getAttribute('y2') || 0)
        length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      } else if (path.tagName.toLowerCase() === 'circle') {
        const r = parseFloat(path.getAttribute('r') || 0)
        length = 2 * Math.PI * r
      }
      length = length * 1.02
    } catch (e) {
      console.warn('Could not calculate length for path:', path, e)
    }

    if (!Number.isFinite(length) || length <= 0) {
      length = 500
    }

    gsap.set(path, {
      fill: 'none',
      stroke: `url(#${gradId})`,
      strokeWidth: 2,
      strokeLinecap: linecap,
      strokeLinejoin: 'round',
      strokeDasharray: length,
      strokeDashoffset: length,
    })
  })

  return { paths }
}

      const iconPrep0 = prepareIcon(icon0, 'iconGrad0', 'round') // Brain - round
      const iconPrep1 = prepareIcon(icon1, 'iconGrad1', 'butt')  // Globe - butt
      const iconPrep2 = prepareIcon(icon2, 'iconGrad2', 'butt')  // Share2 - butt

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top-=50vh top',
          end: '+=900vh',
          scrub: true,
          pin: true,
          onUpdate: (st) => {
            if (st.progress >= 1 && pulseTween) pulseTween.kill()
          },
        },
      })

      // Brain (card0) -> text reveal -> right pipe -> button 1/3 fill
      tl.to(icon0, { opacity: 1, duration: 0.3 })
        .to(
          iconPrep0.paths,
          {
            strokeDashoffset: 0,
            duration: 2,
            stagger: 0.15,
            ease: 'power2.inOut',
          },
          '<0.1'
        )
        .to(iconTitleContainer0, { yPercent: -25, duration: 0.8 }, '-=0.5')
        .to(desc0, { opacity: 1, duration: 0.8 }, '<')
        .to(left, { strokeDashoffset: 0, opacity: 1, duration: 1.2 }, '-=0.2')
        .to(fill, { scaleX: 0.33, duration: 1 }, '<')

        // Globe (card1) -> text reveal -> middle pipe -> button 2/3 fill
        .to(icon1, { opacity: 1, duration: 0.3 })
        .to(
          iconPrep1.paths,
          {
            strokeDashoffset: 0,
            duration: 2,
            stagger: 0.15,
            ease: 'power2.inOut',
          },
          '<0.1'
        )
        .to(iconTitleContainer1, { yPercent: -25, duration: 0.8 }, '-=0.5')
        .to(desc1, { opacity: 1, duration: 0.8 }, '<')
        .to(middle, { strokeDashoffset: 0, opacity: 1, duration: 1.2 }, '-=0.2')
        .to(fill, { scaleX: 0.66, duration: 1 }, '<')

        // Share2 (card2) -> text reveal -> left pipe -> button 3/3 fill
        .to(icon2, { opacity: 1, duration: 0.3 })
        .to(
          iconPrep2.paths,
          {
            strokeDashoffset: 0,
            duration: 2,
            stagger: 0.15,
            ease: 'power2.inOut',
          },
          '<0.1'
        )
        .to(iconTitleContainer2, { yPercent: -25, duration: 0.8 }, '-=0.5')
        .to(desc2, { opacity: 1, duration: 0.8 }, '<')
        .to(right, { strokeDashoffset: 0, opacity: 1, duration: 1.2 }, '-=0.2')
        .to(fill, { scaleX: 1, duration: 1 }, '<')

      return () => {
        tl.scrollTrigger && tl.scrollTrigger.kill()
        tl.kill()
        pulseTween.kill()
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-white relative flex items-start"
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
              />
            </div>
          ))}
        </div>

        {/* DIV 2: SVG PIPELINES (BEHIND) + SCROLL BUTTON */}
        <div className="relative mt-16 flex flex-col items-center z-10">
          <div className="absolute -top-20 left-0 right-0 flex justify-center -z-10 pointer-events-none">
            <svg viewBox="0 0 1000 220" className="w-full max-w-5xl h-52">
              <defs>
                <linearGradient id="pipeBase" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d1d5db" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#9ca3af" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d1d5db" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="pipeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              <path
                d="M0 0 V110 H430"
                stroke="url(#pipeBase)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M500 0 V110 H0"
                stroke="url(#pipeBase)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M1000 0 V110 H570"
                stroke="url(#pipeBase)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />

              <path
                ref={leftPathRef}
                d="M0 0 V110 H430"
                stroke="url(#pipeGlow)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]"
              />
              <path
                ref={middlePathRef}
                d="M500 0 V110 H0"
                stroke="url(#pipeGlow)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                className="drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]"
              />
              <path
                ref={rightPathRef}
                d="M1000 0 V110 H570"
                stroke="url(#pipeGlow)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                className="drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]"
              />
            </svg>
          </div>

          <button
            ref={scrollButtonRef}
            type="button"
            className="pointer-events-none relative mt-2 px-8 py-3 rounded-full border border-cyan-400/60 bg-slate-950/80 text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase text-cyan-100 shadow-[0_0_30px_rgba(59,130,246,0.65)] overflow-hidden"
          >
            <div
              ref={buttonFillRef}
              className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 opacity-90"
              style={{ transformOrigin: 'left' }}
            />
            <span className="relative z-10">Scroll</span>
          </button>
            {/* New SVG with vertical glowing line below scroll button */}
            <div className="flex justify-center mt-8">
              <svg viewBox="0 0 40 120" width="40" height="120">
                <defs>
                  <linearGradient id="verticalGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs> 
                <line
                  x1="20" y1="0" x2="20" y2="120"
                  stroke="url(#verticalGlow)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]"
                />
              </svg>
            </div>
        </div>
      </div>
    </section>
  )
}

export default Features