import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Card1Content from '../components/cards/expanded/Card1Content'

export default function Breakdown() {
  const location = useLocation()
  const { brdUrl: stateBrdUrl, strategyMarkdown: stateStrategyMarkdown } = location.state || {}
  const [brdUrl, setBrdUrl] = useState(stateBrdUrl || null)
  const [strategyMarkdown, setStrategyMarkdown] = useState(stateStrategyMarkdown || null)

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

  return (
    <div className="min-h-screen w-full bg-slate-950 py-12 px-4 md:px-10 text-white">
      <div className="max-w-5xl mx-auto">
        <Card1Content brdUrl={brdUrl} strategyMarkdown={strategyMarkdown} />
      </div>
    </div>
  )
}
