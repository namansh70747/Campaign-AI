import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Card2Content({ landingPageCode }) {
  const navigate = useNavigate()
  const [code, setCode] = useState(landingPageCode || `import React from 'react'\n\nfunction Website() {\n  return (<div>Preview</div>)\n}\n\nexport default Website`)
  const [deploying, setDeploying] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState(null)
  const [deployError, setDeployError] = useState(null)

  const handleRegenerate = () => {
    const variations = [
      `// Regenerated Code Version 1\nimport React from 'react'\nexport default function Home() { return <div>Home</div> }`,
      `// Regenerated Code Version 2\nimport React from 'react'\nexport default function App() { return <div>App</div> }`
    ]
    setCode(variations[Math.floor(Math.random() * variations.length)])
    alert('Code regenerated successfully!')
  }

  const handleCopyCode = () => {
    if (landingPageCode) {
      navigator.clipboard.writeText(landingPageCode)
      alert('Code copied to clipboard!')
    }
  }

  // If landing page HTML exists, go straight to the Web Editor
  // so users can immediately tweak and preview the generated page.
  if (landingPageCode) {
    // Avoid pushing multiple times if already on editor
    // This component is used inside a card; on initial render with code present,
    // direct users to the editor route with the HTML from backend.
    navigate('/web-editor', { state: { html: landingPageCode } })
    return null
  }

  const handleDeployToVercel = async () => {
    if (!landingPageCode) return

    setDeploying(true)
    setDeployError(null)
    setDeploymentUrl(null)

    try {
      // Call backend API to deploy to Vercel
      const response = await fetch('http://localhost:8000/deploy_to_vercel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: landingPageCode,
          project_name: `campaign-${Date.now()}` // Unique project name
        })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        setDeploymentUrl(data.url)
        alert(`🎉 Successfully deployed to Vercel!\n\nURL: ${data.url}`)
      } else {
        throw new Error(data.error || 'Deployment failed')
      }
    } catch (error) {
      console.error('Deployment error:', error)
      setDeployError(error.message)
      alert(`❌ Deployment failed: ${error.message}`)
    } finally {
      setDeploying(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <h2 className="text-4xl font-bold text-white mb-6">Get the website ready</h2>
      
      {landingPageCode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Panel */}
          <div className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-black/30 py-3 px-4 border-b border-white/10 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"/>
                <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                <div className="w-3 h-3 rounded-full bg-green-500"/>
              </div>
              <span className="text-white/60 text-sm">landing-page.html</span>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              <pre className="text-sm text-green-400 overflow-x-auto bg-black/50 rounded-lg p-4">
                <code>{landingPageCode}</code>
              </pre>
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                📋 Copy Code
              </button>
              <button
                onClick={handleDeployToVercel}
                disabled={deploying}
                className="flex-1 py-2 px-4 bg-black hover:bg-gray-900 text-white rounded-lg font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deploying ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Deploying...
                  </>
                ) : (
                  <>▲ Deploy to Vercel</>
                )}
              </button>
            </div>
            {deploymentUrl && (
              <div className="p-4 bg-green-500/20 border-t border-green-500/50">
                <p className="text-green-200 text-sm mb-2">✅ Deployed successfully!</p>
                <a 
                  href={deploymentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-300 hover:text-green-100 text-sm underline break-all"
                >
                  {deploymentUrl}
                </a>
              </div>
            )}
            {deployError && (
              <div className="p-4 bg-red-500/20 border-t border-red-500/50">
                <p className="text-red-200 text-sm">❌ {deployError}</p>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="bg-gray-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-black/30 py-3 px-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Live Preview</h3>
              <div className="flex gap-2 text-xs text-white/60">
                <span>Desktop</span><span>•</span><span>1920x1080</span>
              </div>
            </div>
            <iframe
              className="w-full h-[500px] bg-white"
              srcDoc={landingPageCode}
              title="Landing Page Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"/>
                <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                <div className="w-3 h-3 rounded-full bg-green-500"/>
              </div>
              <span className="text-white/60 text-sm">website.jsx</span>
            </div>
            <pre className="text-sm text-green-400 overflow-x-auto bg-black/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <code>{code}</code>
            </pre>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Website Preview</h3>
              <div className="flex gap-2 text-xs text-white/60">
                <span>Desktop</span><span>•</span><span>1920x1080</span>
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg border border-white/10 p-8 flex items-center justify-center min-h-96">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-purple-500/20 rounded-full mx-auto"/>
                <p className="text-white/60">⏳ Waiting for landing page generation...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {landingPageCode && (
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={handleRegenerate} 
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg"
        >
          🔄 Regenerate Code
        </motion.button>
      )}
    </motion.div>
  )
}

export default Card2Content
