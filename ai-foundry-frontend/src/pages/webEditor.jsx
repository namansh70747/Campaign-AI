import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../components/Button'

export default function WebEditor(){
  const loc = useLocation()
  const [html, setHtml] = useState('<!-- Paste landing page HTML here -->')
  const [deploying, setDeploying] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState(null)
  const [deployError, setDeployError] = useState(null)

  useEffect(() => {
    if (loc?.state?.html) {
      setHtml(loc.state.html)
      return
    }
    try {
      const stored = localStorage.getItem('campaign_landingPageCode')
      if (stored) setHtml(stored)
    } catch (e) {
      console.error('Failed loading landingPageCode from storage', e)
    }
  }, [loc])

  const handleRegenerate = () => {
    const variations = [
      `<!-- Regenerated HTML Version 1 -->\n<!DOCTYPE html>\n<html>\n<head><title>Landing Page</title></head>\n<body><h1>Version 1</h1></body>\n</html>`,
      `<!-- Regenerated HTML Version 2 -->\n<!DOCTYPE html>\n<html>\n<head><title>Landing Page</title></head>\n<body><h1>Version 2</h1></body>\n</html>`
    ]
    setHtml(variations[Math.floor(Math.random() * variations.length)])
    alert('Code regenerated successfully!')
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(html)
    alert('Code copied to clipboard!')
  }

  const handleDeployToVercel = async () => {
    if (!html) return

    setDeploying(true)
    setDeployError(null)
    setDeploymentUrl(null)

    try {
      const response = await fetch('http://localhost:8000/deploy_to_vercel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: html,
          project_name: `campaign-${Date.now()}`
        })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        setDeploymentUrl(data.url)
        alert(`Successfully deployed to Vercel!\n\nURL: ${data.url}`)
      } else {
        throw new Error(data.error || 'Deployment failed')
      }
    } catch (error) {
      console.error('Deployment error:', error)
      setDeployError(error.message)
      alert(`Deployment failed: ${error.message}`)
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)' }}>
      <div className="max-w-[1100px] mx-auto px-5 py-6">
        <div className="pt-12">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Urbanist, sans-serif' }}>Web Editor</h1>
          <p className="mb-6 text-gray-700">Edit the generated landing page HTML.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor Panel */}
            <div className="rounded-2xl border border-gray-200 shadow-md bg-white overflow-hidden">
              <div className="py-3 px-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-600 text-sm">landing-page.html</span>
              </div>
              <div className="p-4">
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="w-full h-[460px] font-mono text-[13px] p-3 border border-gray-200 rounded-lg bg-white text-gray-900 resize-y"
                />
              </div>
              <div className="p-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  Copy Code
                </button>
                <button
                  onClick={handleRegenerate}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  Regenerate
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
                    <>Deploy to Vercel</>
                  )}
                </button>
              </div>
              {deploymentUrl && (
                <div className="p-4 bg-green-500/20 border-t border-green-500/50">
                  <p className="text-green-700 text-sm mb-2">Deployed successfully!</p>
                  <a 
                    href={deploymentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 text-sm underline break-all"
                  >
                    {deploymentUrl}
                  </a>
                </div>
              )}
              {deployError && (
                <div className="p-4 bg-red-500/20 border-t border-red-500/50">
                  <p className="text-red-700 text-sm">{deployError}</p>
                </div>
              )}
            </div>

            {/* Live Preview Panel */}
            <div className="rounded-2xl border border-gray-200 shadow-md bg-white overflow-hidden">
              <div className="py-3 px-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100">
                <h3 className="text-gray-800 font-semibold">Live Preview</h3>
                <div className="flex gap-2 text-xs text-gray-600">
                  <span>Desktop</span><span>•</span><span>1920x1080</span>
                </div>
              </div>
              <iframe
                className="w-full h-[520px] bg-white"
                srcDoc={html}
                title="Landing Page Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}