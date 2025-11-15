import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function Breakdown() {
  const location = useLocation()
  const { brdUrl: stateBrdUrl, strategyMarkdown: stateStrategyMarkdown } = location.state || {}
  const [brdUrl, setBrdUrl] = useState(stateBrdUrl || null)
  const [strategyMarkdown, setStrategyMarkdown] = useState(stateStrategyMarkdown || null)
  const timelineRef = useRef(null)

  useEffect(() => {
    if (!stateBrdUrl || !stateStrategyMarkdown) {
      try {
        const stored = localStorage.getItem('campaign_breakdown')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (!brdUrl && parsed.brdUrl) setBrdUrl(parsed.brdUrl)
          if (!strategyMarkdown && parsed.strategyMarkdown) setStrategyMarkdown(parsed.strategyMarkdown)
        }
      } catch (e) {
        console.error('Failed to load breakdown from storage', e)
      }
    }
  }, [stateBrdUrl, stateStrategyMarkdown, brdUrl, strategyMarkdown])

  useEffect(() => {
    const items = document.querySelectorAll('.timeline li')

    function isElementInViewport(el) {
      const rect = el.getBoundingClientRect()
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      )
    }

    function callbackFunc() {
      for (let i = 0; i < items.length; i++) {
        if (isElementInViewport(items[i])) {
          items[i].classList.add('in-view')
        }
      }
    }

    window.addEventListener('load', callbackFunc)
    window.addEventListener('resize', callbackFunc)
    window.addEventListener('scroll', callbackFunc)
    
    callbackFunc()

    return () => {
      window.removeEventListener('load', callbackFunc)
      window.removeEventListener('resize', callbackFunc)
      window.removeEventListener('scroll', callbackFunc)
    }
  }, [strategyMarkdown])

  const handleGenerateBRD = () => {
    if (brdUrl) {
      const filename = brdUrl.split('/').pop().split('\\').pop()
      const downloadUrl = `http://localhost:8000/download_brd/${filename}`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
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

  const parseStrategy = (markdown) => {
    if (!markdown) return []
    
    const lines = markdown.split('\n')
    const sections = []
    let currentSection = null
    
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        return
      }
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          title: line.replace(/^#{2,3}\s+/, '').trim(),
          content: []
        }
      } else if (currentSection && line.trim()) {
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
    <div className="min-h-screen w-full bg-white py-12 px-4">
      <style>{`
        .timeline {
          padding: 30px 0;
        }

        .timeline ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .timeline ul li {
          list-style-type: none;
          position: relative;
          width: 6px;
          margin: 0 auto;
          padding-top: 10px;
          background: #c3d6ff;
        }

        .timeline ul li::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #c3d6ff;
          transition: background 0.5s ease-in-out;
        }

        .timeline ul li.in-view::after {
          background: #6192fb;
        }

        .timeline ul li div {
          position: relative;
          bottom: 0;
          width: 400px;
          padding: 15px;
          background: #8052ff;
          border-radius: 8px;
          visibility: hidden;
          opacity: 0;
          transition: all 0.5s ease-in-out;
        }

        .timeline ul li div::before {
          content: '';
          position: absolute;
          bottom: 7px;
          width: 0;
          height: 0;
          border-style: solid;
        }

        .timeline ul li:nth-child(odd) div {
          left: 45px;
          transform: translate3d(200px, 0, 0);
        }

        .timeline ul li:nth-child(odd) div::before {
          left: -15px;
          border-width: 8px 16px 8px 0;
          border-color: transparent #8052ff transparent transparent;
        }

        .timeline ul li:nth-child(even) div {
          left: -439px;
          transform: translate3d(-200px, 0, 0);
        }

        .timeline ul li:nth-child(even) div::before {
          right: -15px;
          border-width: 8px 0 8px 16px;
          border-color: transparent transparent transparent #8052ff;
        }

        .timeline ul li.in-view div {
          transform: none;
          visibility: visible;
          opacity: 1;
        }

        .phase-label {
          display: block;
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 8px;
          font-family: 'Urbanist', sans-serif;
        }

        @media screen and (max-width: 900px) {
          .timeline ul li div {
            width: 250px;
          }
          .timeline ul li:nth-child(even) div {
            left: -289px;
          }
        }

        @media screen and (max-width: 600px) {
          .timeline ul li {
            margin-left: 20px;
          }
          .timeline ul li div {
            width: calc(100vw - 91px);
          }
          .timeline ul li:nth-child(even) div {
            left: 45px;
          }
          .timeline ul li:nth-child(even) div::before {
            left: -15px;
            border-width: 8px 16px 8px 0;
            border-color: transparent #8052ff transparent transparent;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800" style={{ fontFamily: 'Urbanist, sans-serif' }}>
          Campaign Strategy Breakdown
        </h1>

        {strategySections && strategySections.length > 0 ? (
          <section className="timeline" ref={timelineRef}>
            <ul>
              {strategySections.map((section, index) => (
                <li key={index}>
                  <div className="reveal">
                    <p className="text-white">
                      <span className="phase-label">PHASE {index + 1}</span>
                      <strong className="text-lg" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                        {section.title}
                      </strong>
                      <br />
                      {section.content.map((line, idx) => (
                        <React.Fragment key={idx}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="text-center text-gray-500 italic py-10">
            Strategy breakdown will appear here once the Strategy Agent completes...
          </div>
        )}

        {/* BRD Section */}
        <div className="max-w-2xl mx-auto mt-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Urbanist, sans-serif' }}>
            Business Requirements Document
          </h2>
          {brdUrl ? (
            <div className="space-y-4">
              <p className="text-purple-700 text-base mb-4">
                Your BRD has been generated successfully!
              </p>
              <button
                onClick={handleGenerateBRD}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                Download BRD PDF
              </button>
            </div>
          ) : (
            <div className="text-gray-500 italic text-center py-6">
              The Business Requirements Document will appear here once the BRD Agent completes.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
