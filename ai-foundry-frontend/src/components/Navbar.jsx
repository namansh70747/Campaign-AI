import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Button from './Button'

function Navbar() {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Learn', href: '#learn' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#about' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'glass-strong shadow-lg py-3' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <motion.a
            href="#"
            className="text-2xl font-bold bg-gradient-to-b from-[#FF9999] to-[#AA6677] bg-clip-text text-transparent"
            style={{
              fontFamily: '"Bodoni Poster Compressed", serif',
              letterSpacing: '-0.02em',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            NAAMBATADO
          </motion.a>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-8 items-center space-x-8" style={{ fontFamily: "'Roboto', sans-serif" }}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={` hover:text-[#9333EA] transition-colors duration-200 font-medium
                    ${isScrolled 
                    ? 'text-gray-500' 
                    : 'text-gray-500'}`}              
      >
                {link.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4" style={{ fontFamily: "'Roboto', sans-serif" }}>
            <Button variant="ghost" size="sm">
              Login
            </Button>
            <Button onClick={() => navigate("/prompt")} variant="primary" size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
