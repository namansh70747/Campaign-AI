import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// small helper to convert hex -> rgba string used for shadows/gradients
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function Card({ id, title, description, accentColor = 'accent', brdUrl, strategyMarkdown, landingPageCode, contentData, generatedAssets }) {
  const navigate = useNavigate()
  const colors = ['#f472b6','#a855f7', '#ec4899', '#fb7185']

  const isReady = (() => {
    if (id === 1) return Boolean(brdUrl) && Boolean(strategyMarkdown)
    if (id === 2) return Boolean(landingPageCode)
    if (id === 3) return Boolean(contentData) && Boolean(generatedAssets)
    if (id === 4) return true
    return true
  })()

  const handleClick = () => {
    if (!isReady) return
    if (id === 1) {
      navigate('/breakdown', { state: { brdUrl, strategyMarkdown } })
    } else if (id === 2) {
      const state = landingPageCode ? { html: landingPageCode } : undefined
      navigate('/web-editor', { state })
    } else if (id === 3) {
      navigate('/postmaker', { state: { contentData, generatedAssets } })
    } else if (id === 4) {
      navigate('/control')
    }
  }

  return (
    <motion.div
      whileHover={isReady ? {
        scale: 1.045,
        y: -10,
        boxShadow: `0 30px 60px ${hexToRgba(colors[0], 0.12)}, 0 12px 24px rgba(2,6,23,0.5)`,
      } : undefined}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      role="button"
      tabIndex={isReady ? 0 : -1}
      className={`
        relative rounded-2xl p-8
        border border-white/10
        backdrop-blur-sm
        transition-all duration-300
        min-h-[240px]
        flex flex-col justify-between
        group
        overflow-visible
        ${isReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
      `}
      style={{background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)'}}
    >

      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
        <div className="w-full h-full p-3">
          <div
            aria-hidden
            className="w-full h-full rounded-2xl"
            style={{
              background: `radial-gradient(420px 220px at 30% 50%, ${hexToRgba(
                colors[0],
                0.28
              )}, transparent 30%), radial-gradient(420px 220px at 90% 80%, ${hexToRgba(
                colors[1],
                0.22
              )}, transparent 25%)`,
              filter: 'blur(36px)',
              transform: 'scale(1.05)'
            }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-4xl font-bold mb-2 text-purple-200" style={{fontFamily: 'Urbanist, sans-serif', fontWeight: 800}}>
          {String(id).padStart(2, '0')}
        </div>
        <h3 className="text-xl font-bold text-purple-900 mb-3 leading-tight" style={{fontFamily: 'Urbanist, sans-serif', fontWeight: 800}}>
          {title}
        </h3>
        <p className="text-purple-700 text-sm">
          {description}
        </p>
        {!isReady && (
          <p className="mt-3 text-xs font-semibold text-purple-500">Waiting for backend...</p>
        )}
      </div>
    </motion.div>
  )
}

export default Card
