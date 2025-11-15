import { motion } from 'framer-motion'
import React, { useRef, useEffect } from 'react'
import { MessageSquare, Search, Rocket, TrendingUp } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const HowItWorks = () => {
  const buttonRef = useRef(null)
  const lineRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    if (!buttonRef.current || !lineRef.current) return

    const ctx = gsap.context(() => {
      // Set initial button state
      gsap.set(buttonRef.current, {
        background: 'transparent',
        border: '2px solid #667eea',
      })

      // Prepare line
      const line = lineRef.current
      const lineLength = line.getTotalLength()
      gsap.set(line, {
        strokeDasharray: lineLength,
        strokeDashoffset: lineLength,
        opacity: 0,
      })

      // Prepare icons with gradient and stroke animation
      const prepareIcon = (iconContainer, gradId) => {
        if (!iconContainer) return { paths: [] }

        const svg =
          iconContainer.tagName?.toLowerCase() === 'svg'
            ? iconContainer
            : iconContainer.querySelector('svg')

        if (!svg) return { paths: [] }

        // Inject gradient once
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
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeDasharray: length,
            strokeDashoffset: length,
          })
        })

        return { paths }
      }

      // Prepare all icons
      const iconPreps = cardsRef.current.map((card, index) => {
        const iconAnimate = card?.querySelector('.icon-animate')
        if (iconAnimate) {
          gsap.set(iconAnimate, { opacity: 0.3 })
          return prepareIcon(iconAnimate, `workflowIconGrad${index}`)
        }
        return { paths: [] }
      })

      // Icons and line animation - triggers when first card enters viewport
      ScrollTrigger.create({
        trigger: cardsRef.current[0],
        start: 'top 80%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline()

          // Animate all icons simultaneously
          iconPreps.forEach((iconPrep, index) => {
            const iconAnimate = cardsRef.current[index]?.querySelector('.icon-animate')
            if (iconAnimate && iconPrep.paths.length > 0) {
              tl.to(iconAnimate, { opacity: 1, duration: 0.2 }, 0)
              tl.to(
                iconPrep.paths,
                {
                  strokeDashoffset: 0,
                  duration: 2,
                  stagger: 0.1,
                  ease: 'power2.inOut',
                },
                0
              )
            }
          })

          // Animate line simultaneously
          tl.to(
            line,
            {
              strokeDashoffset: 0,
              opacity: 1,
              duration: 2,
              ease: 'power2.inOut',
            },
            0
          )
        },
      })

      // Button fill animation - independent trigger
      ScrollTrigger.create({
        trigger: buttonRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(buttonRef.current, {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '2px solid transparent',
            duration: 1.5,
            ease: 'power2.inOut',
          })
        },
      })
    })

    return () => ctx.revert()
  }, [])

  const steps = [
    {
      number: '01',
      icon: MessageSquare,
      title: 'Share Your Vision',
      description: 'Tell us about your startup idea in plain language—no technical jargon needed.',
    },
    {
      number: '02',
      icon: Search,
      title: 'AI Breaks It Down',
      description: 'Our AI analyzes and creates a detailed workflow with actionable tasks.',
    },
    {
      number: '03',
      icon: Rocket,
      title: 'Instant Deployment',
      description: 'Get your website generated and deployed while we prep your social content.',
    },
    {
      number: '04',
      icon: TrendingUp,
      title: 'Automated Growth',
      description: 'Watch your startup grow as we handle posting and track your progress.',
    },
  ]

  return (
    <section id="learn" className="min-h-screen flex items-center py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-7xl w-full">

        {/* First Way - If you have idea for your startup */}
        <div className="mb-20">
          <div className="relative">
            {/* Connecting Line - Hidden on mobile */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 pointer-events-none" 
                 style={{ margin: '0 10%' }}>
              <svg viewBox="0 0 1000 2" className="w-full h-0.5" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="workflowLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <line
                  ref={lineRef}
                  x1="0" y1="1" x2="1000" y2="1"
                  stroke="url(#workflowLineGlow)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]"
                />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={`way1-${step.number}`}
                  ref={(el) => (cardsRef.current[index] = el)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass rounded-2xl p-6 md:p-8 transition-all duration-300 relative group overflow-hidden"
                  style={{
                    aspectRatio: '1/1',
                    background:
                      'linear-gradient(to bottom right, #C084FC, #A855F7 20%, #7C3AED 65%, #6B21A8)',
                  }}
                >
                  {/* Step Number */}
                  <div className="absolute top-4 right-4 text-4xl font-bold text-white/20 group-hover:text-white/40 transition-colors duration-200">
                    {step.number}
                  </div>

                  <div className="flex flex-col h-full justify-center items-center text-center gap-4">
                    {/* Icon */}
                    <div className="relative">
                      {/* Dark silhouette background */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <step.icon className="w-16 h-16 md:w-20 md:h-20 text-black/10" />
                      </div>
                      {/* Animated icon on top */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                        className="icon-animate relative"
                      >
                        <step.icon className="w-16 h-16 md:w-20 md:h-20" strokeWidth={1.5} />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl md:text-2xl font-bold text-white heading-gradient press-start-2p-regular">
                      {step.title}
                    </h3>
                    <p className="text-white/90 leading-relaxed px-2">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-16">
          <motion.a
            ref={buttonRef}
            href="/prompt"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block relative px-12 py-5 text-lg font-bold rounded-full overflow-hidden group"
            style={{
              color: '#667eea',
            }}
          >
            <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-white" style={{ color: 'inherit' }}>
              Get Started
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </span>
          </motion.a>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks

