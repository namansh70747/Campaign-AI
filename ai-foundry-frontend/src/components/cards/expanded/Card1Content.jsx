import { motion } from 'framer-motion'

function Card1Content({ brdUrl, strategyMarkdown }) {
  const handleGenerateBRD = () => {
    if (brdUrl) {
      // Extract filename from the path (e.g., "campaign_outputs/chromadb-v_brd.pdf" -> "chromadb-v_brd.pdf")
      const filename = brdUrl.split('/').pop().split('\\').pop()
      
      // Use the backend API endpoint to download the file
      const downloadUrl = `http://localhost:8000/download_brd/${filename}`
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // Fallback to generating a sample BRD
      const brdContent = `BUSINESS REQUIREMENT DOCUMENT (BRD)\n\nProject: Website Development & Marketing Automation\nDate: ${new Date().toLocaleDateString()}\n\n1. PROJECT OVERVIEW\n   - Goal: Create a comprehensive website with automated marketing capabilities\n   - Target Audience: Small to medium businesses\n   - Timeline: 8-12 weeks\n\nEND OF DOCUMENT`.trim()

      const blob = new Blob([brdContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'BRD.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('BRD.txt has been downloaded successfully!')
    }
  }

  // Parse markdown into structured sections
  const parseStrategy = (markdown) => {
    if (!markdown) return []
    
    // Split by heading markers (## or ###)
    const lines = markdown.split('\n')
    const sections = []
    let currentSection = null
    
    lines.forEach(line => {
      // Check for main heading
      if (line.startsWith('# ')) {
        // Skip main title
        return
      }
      // Check for section headings
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          title: line.replace(/^#{2,3}\s+/, '').trim(),
          content: []
        }
      } else if (currentSection && line.trim()) {
        // Add content to current section
        currentSection.content.push(line.trim())
      }
    })
    
    if (currentSection) {
      sections.push(currentSection)
    }
    
    return sections
  }

  const strategySections = parseStrategy(strategyMarkdown)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <h2 className="text-4xl font-bold text-white mb-6">Get breakdown of your final goal</h2>
      
      {/* Strategy Breakdown Section */}
      {strategyMarkdown ? (
        <div className="bg-black/40 rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-3xl font-semibold text-purple-300 mb-6 flex items-center gap-3">
            <span>📈</span>
            <span>Strategic Approach</span>
          </h3>
          <div className="space-y-5">
            {strategySections.map((section, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-l-4 border-purple-500 bg-white/5 rounded-r-lg pl-5 pr-4 py-4 hover:bg-white/10 transition-all duration-300"
              >
                <h4 className="font-bold text-xl mb-3 text-white">{section.title}</h4>
                <div className="text-white/80 space-y-2">
                  {section.content.map((line, idx) => (
                    <p key={idx} className="leading-relaxed">{line}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-black/40 rounded-2xl p-6 border border-white/10">
          <h3 className="text-2xl font-semibold text-purple-300 mb-4">Goal Breakdown</h3>
          <div className="text-gray-400 italic text-center py-10">
            Strategy breakdown will appear here once the Strategy Agent completes...
          </div>
        </div>
      )}

      {/* BRD Section - Integrated from Report page */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2c5282] rounded-2xl p-6 border border-blue-500/30 shadow-lg">
        <h3 className="text-2xl font-bold text-white mb-4">Business Requirements Document</h3>
        {brdUrl ? (
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-6">
              <p className="text-blue-300 text-base mb-4">✅ Your BRD has been generated successfully!</p>
              <button 
                onClick={handleGenerateBRD}
                className="inline-block py-3 px-6 bg-gradient-to-br from-blue-500 to-blue-800 text-white border-none rounded-lg font-semibold text-base transition-all duration-300 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] cursor-pointer"
              >
                📥 Download BRD PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 italic text-center py-6">
            The Business Requirements Document will appear here once the BRD Agent completes.
          </div>
        )}
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={handleGenerateBRD} 
        className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg"
        disabled={!brdUrl}
      >
        {brdUrl ? 'Download BRD' : 'Waiting for BRD Generation...'}
      </motion.button>
    </motion.div>
  )
}

export default Card1Content
