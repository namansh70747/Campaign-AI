import { motion } from 'framer-motion'
import Card from './Card'

const cards = [
  {
    id: 1,
    title: 'Get breakdown of your final goal',
    description: 'Break down your goal into actionable steps and create a structured plan',
    accentColor: 'accent',
  },
  {
    id: 2,
    title: 'Get the website ready',
    description: 'Generate and preview your website code with real-time editing',
    accentColor: 'accent',
  },
  {
    id: 3,
    title: 'Generate and automate Instagram & Twitter posts',
    description: 'Create and schedule social media posts automatically',
    accentColor: 'accent',
  },
  {
    id: 4,
    title: 'Call / Email agent for marketing',
    description: 'Connect with our marketing team for personalized support',
    accentColor: 'accent',
  },
]

function CardGrid({ brdUrl, strategyMarkdown, landingPageCode, contentData, generatedAssets }) {
  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.08,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <Card
              id={card.id}
              title={card.title}
              description={card.description}
              accentColor={card.accentColor}
              brdUrl={brdUrl}
              strategyMarkdown={strategyMarkdown}
              landingPageCode={landingPageCode}
              contentData={contentData}
              generatedAssets={generatedAssets}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default CardGrid
