import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import BackButton from '../components/BackButton'
import Button from '../components/Button'

export default function WebEditor(){
  const loc = useLocation()
  const [html, setHtml] = useState('<!-- Paste landing page HTML here -->')

  useEffect(() => {
    if (loc && loc.state && loc.state.html) {
      setHtml(loc.state.html)
    }
  }, [loc])

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)' }}>
      <div className="max-w-[1100px] mx-auto px-5 py-6">
        <BackButton />

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
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const w = window.open();
                    if (w) {
                      w.document.write(html);
                      w.document.close();
                    }
                  }}
                >
                  Open Preview in New Window
                </Button>
              </div>
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