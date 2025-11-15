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

    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      ScrollTrigger.killAll()
      delete window.lenis
    }
  }, [])

  const scrollToWorkflow = () => {
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

      <main className="relative">
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
        </main>
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage

