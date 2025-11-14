import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Workflow from '../components/HowItWorks'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

function LandingPage() {
  const [scrollLocked, setScrollLocked] = useState(false)
  const lenisRef = useRef(null)
  useEffect(() => {
    // force light mode
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')

    // ----- LENIS SETUP -----
    const lenis = new Lenis({
      lerp: 0.05, // smoothness (lower = slower/smoother)
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.5, // reduce scroll speed
    })

    lenisRef.current = lenis
    // make it accessible globally so other components can scroll
    window.lenis = lenis

    // let ScrollTrigger know when Lenis scrolls
    lenis.on('scroll', ScrollTrigger.update)

    // connect Lenis with GSAP ticker
    const raf = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(raf)

    gsap.ticker.lagSmoothing(0)

    // ----- SNAP BETWEEN SECTIONS -----
    const sections = gsap.utils.toArray('[data-scroll-section]')

    if (sections.length > 0) {
      ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        // snap based on overall scroll progress
        snap: {
          snapTo: (value) => {
            const n = sections.length - 1
            if (n <= 0) return 0
            return Math.round(value * n) / n
          },
          duration: 0.7,
          ease: 'power1.inOut',
        },
      })
    }

    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      ScrollTrigger.killAll()
      delete window.lenis
    }
  }, [])

  // Control Lenis scrolling based on lock state
  useEffect(() => {
    if (lenisRef.current) {
      if (scrollLocked) {
        lenisRef.current.stop()
      } else {
        lenisRef.current.start()
      }
    }
  }, [scrollLocked])

  // Prevent native scrollbar and touch scroll while locked (ensures Lenis stop is effective)
  useEffect(() => {
    const setHidden = () => {
      try {
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        // On touch devices also prevent touch-action to avoid momentum scrolling
        document.documentElement.style.touchAction = 'none'
      } catch (e) {
        // ignore in non-browser environments
      }
    }

    const clearHidden = () => {
      try {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
        document.documentElement.style.touchAction = ''
      } catch (e) {
        // ignore
      }
    }

    if (scrollLocked) {
      setHidden()
    } else {
      clearHidden()
    }

    return () => {
      clearHidden()
    }
  }, [scrollLocked])

  const scrollToWorkflow = () => {
    // Unlock scrolling first
    setScrollLocked(false)
    
    // Then scroll to workflow section
    setTimeout(() => {
      const target = document.querySelector('#workflow-section')
      if (!target) return

      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(target)
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="relative">
        <Navbar />
        <main id="main-content">
          {/* Each of these is a snap section */}
          <section
            data-scroll-section
            className="min-h-screen flex items-stretch z-10"
          >
            <div className="w-full z-10">
              <Hero />
            </div>
          </section>

          <section
            data-scroll-section
            className="min-h-screen flex items-center z-0"
          >
            <div className="w-full">
              <Features 
                onAllClicked={scrollToWorkflow} 
                onScrollLockChange={setScrollLocked}
              />
            </div>
          </section>

          <section
            id="workflow-section"
            data-scroll-section
            className="min-h-screen flex items-center"
          >
            <div className="w-full">
              <Workflow />
            </div>
          </section>

          {/* CTA Button Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <div className="container mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Ready to Build Your Startup?
                </h2>
                <p className="text-lg text-gray-600 mb-10">
                  Start creating your custom AI-powered campaign today
                </p>
                <motion.a
                  href="/prompt"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block relative px-12 py-5 text-lg font-bold text-white rounded-full overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                </motion.a>
              </motion.div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  )
}

export default LandingPage

