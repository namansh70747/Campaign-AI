import React, { useState } from 'react'
import { motion } from 'framer-motion'

const FeatureCard = ({ icon: Icon, title, description, delay = 0, isExpanded, onToggle }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' }}
      className="glass rounded-2xl p-6 md:p-8 transition-all duration-300 group overflow-hidden pointer-events-none"
      style={{
        aspectRatio: '1/1',
        background:
          'linear-gradient(to bottom right, #C084FC, #A855F7 20%, #7C3AED 65%, #6B21A8)',
      }}
    >
      <div className="flex flex-col h-full relative">
        {/* Icon and Title - starts centered, translates to top */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 icon-title-container">
          <div className="relative icon-container">
            {/* Dark silhouette background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-20 h-20 md:w-24 md:h-24 text-black/10" />
            </div>
            {/* Animated icon container (gradient injected dynamically) */}
            <div className="icon-animate relative">
              {/* no text-white here, GSAP will set stroke gradient */}
              <Icon className="w-20 h-20 md:w-24 md:h-24" strokeWidth={1.5} />
            </div>
          </div>

          <h3 className="urbanist-heading text-2xl md:text-3xl font-bold text-white heading-gradient card-title">
            {title}
          </h3>
        </div>

        {/* Description - hidden initially, revealed by scroll in bottom half */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-center justify-center p-4">
          <p
            className="card-description text-white/90 text-sm md:text-base leading-relaxed opacity-0 text-center"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default FeatureCard
