import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

function Postmaker() {
  const location = useLocation()
  const { contentData: stateContentData, generatedAssets: stateGeneratedAssets } = location.state || {}
  let contentData = stateContentData
  let generatedAssets = stateGeneratedAssets

  if (!contentData || !generatedAssets) {
    try {
      const stored = localStorage.getItem('campaign_content')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (!contentData && parsed.contentData) contentData = parsed.contentData
        if (!generatedAssets && parsed.generatedAssets) generatedAssets = parsed.generatedAssets
      }
    } catch (e) {
      console.error('Failed to load content from storage', e)
    }
  }

  const handleInstagramPost = () => {
    alert('Instagram post would be generated/scheduled (simulated).')
  }

  const handleTwitterPost = () => {
    alert('Twitter post would be generated/scheduled (simulated).')
  }

  /* Small inline SVG icon components for action buttons */
  const IconWrapper = ({ children, title }) => (
    <button className="bg-transparent border-none cursor-pointer p-0 flex items-center text-inherit transition-colors hover:text-[#1d9bf0]" title={title} aria-label={title} type="button">{children}</button>
  )

  const HeartIcon = ({ filled=false }) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={filled ? '#e0245e' : 'none'} stroke={filled ? '#e0245e' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.8 4.6c-1.9-1.8-5-1.7-6.9.2l-.9.9-.9-.9C10.2 2.9 7.1 2.8 5.2 4.6 2.9 6.8 3 10.6 5.4 13.1L12 19.6l6.6-6.5c2.4-2.4 2.5-6.2.2-8.5z" />
    </svg>
  )

  const CommentIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )

  const ShareIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )

  const BookmarkIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )

  const RetweetIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="23 7 23 1 17 1" />
      <path d="M20 8v6a3 3 0 0 1-3 3H7" />
      <polyline points="1 17 1 23 7 23" />
      <path d="M4 16v-6a3 3 0 0 1 3-3h10" />
    </svg>
  )

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen w-full py-10 px-4 md:px-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 p-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-6">Generate and automate Instagram & Twitter posts</h2>
        
        {contentData && contentData.social_posts && contentData.social_posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 justify-items-center">
            {contentData.social_posts.map((post, index) => {
              const platform = (post.platform || '').toLowerCase()
              const isTwitter = platform.includes('twitter') || platform.includes('x')
              const isInstagram = platform.includes('instagram') || platform.includes('insta')

              if (isInstagram) {
                return (
                  <div key={index} className="bg-black text-white border border-white/20 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] w-full">
                    <div className="flex justify-between items-center py-3.5 px-4 border-b border-white/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] border-2 border-black shadow-[0_0_0_1px_rgba(255,255,255,0.2)]" />
                        <div className="font-semibold text-sm text-white">YOURPAGENAME</div>
                      </div>
                      <div className="text-xl font-bold text-white cursor-pointer">⋯</div>
                    </div>

                    <div className="relative w-full aspect-square">
                      {(() => {
                        const imgUrl = generatedAssets?.[`post_${index + 1}_image_url`] || post.image_url || null
                        const videoUrl = post.video_url || null
                        const duration = post.duration || post.video_duration || post.video_time || ''

                        if (videoUrl) {
                          return (
                            <div className="relative w-full h-full bg-gray-900">
                              <video className="w-full h-full object-cover" src={videoUrl} controls />
                              {duration && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {duration}
                                </div>
                              )}
                            </div>
                          )
                        } else if (imgUrl) {
                          return <img src={imgUrl} alt="Instagram post" className="w-full h-full object-cover" />
                        } else {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-white text-lg font-semibold">No Image</span>
                            </div>
                          )
                        }
                      })()}
                    </div>

                    <div className="flex justify-between py-2 px-4">
                      <div className="flex gap-4">
                        <IconWrapper title="Like"><HeartIcon /></IconWrapper>
                        <IconWrapper title="Comment"><CommentIcon /></IconWrapper>
                        <IconWrapper title="Share"><ShareIcon /></IconWrapper>
                      </div>
                      <div className="flex gap-4">
                        <IconWrapper title="Save"><BookmarkIcon /></IconWrapper>
                      </div>
                    </div>

                    <div className="px-4 font-semibold text-sm text-white mb-2">{post.likes || post.like_count || '—'} likes</div>

                    <div className="px-4 text-sm text-white leading-normal mb-2">
                      <strong className="font-semibold mr-1.5">{post.handle || post.username || 'YOURPAGENAME'}</strong> {post.content || post.caption || ''}
                    </div>

                    <div className="px-4 text-sm text-white/60 mb-3 cursor-pointer">View all {post.comments_count || post.comment_count || '0'} comments</div>

                    <div className="px-4 py-4 border-t border-white/20">
                      <input placeholder="Add a comment..." className="w-full border-none outline-none text-sm text-white bg-transparent placeholder:text-white/60" />
                    </div>
                  </div>
                )
              }

              if (isTwitter) {
                const imgUrl = generatedAssets?.[`post_${index + 1}_image_url`] || post.image_url || null
                const duration = post.duration || post.video_duration || post.video_time || ''

                return (
                  <div key={index} className="bg-black text-white border border-white/20 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] w-full max-w-[500px]">
                    <div className="flex gap-3 p-4 border-b border-white/20">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white/10 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-white truncate">{post.handle || post.username || 'YOURHANDLE'}</div>
                          <div className="text-blue-400">
                            <svg viewBox="0 0 22 22" width="18" height="18" fill="currentColor">
                              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                            </svg>
                          </div>
                          <div className="text-gray-500 text-sm">@{post.handle || post.username || 'yourhandle'}</div>
                          <div className="text-gray-500 text-sm">· {post.timestamp || '2h'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3">
                      <p className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">{post.content || post.text || post.tweet || ''}</p>
                      {imgUrl && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 mb-3">
                          <img src={imgUrl} alt="Tweet media" className="w-full h-auto" />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-around py-2 px-4 border-t border-white/20 text-gray-500">
                      <IconWrapper title="Reply">
                        <CommentIcon />
                        <span className="ml-2 text-sm">{post.replies || post.reply_count || '0'}</span>
                      </IconWrapper>
                      <IconWrapper title="Retweet">
                        <RetweetIcon />
                        <span className="ml-2 text-sm">{post.retweets || post.retweet_count || '0'}</span>
                      </IconWrapper>
                      <IconWrapper title="Like">
                        <HeartIcon />
                        <span className="ml-2 text-sm">{post.likes || post.like_count || '0'}</span>
                      </IconWrapper>
                      <IconWrapper title="Share">
                        <ShareIcon />
                      </IconWrapper>
                    </div>
                  </div>
                )
              }

              return null
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 rounded-2xl p-6 border border-white/10 text-white/90">
              <h3 className="font-semibold mb-2">Instagram</h3>
              <p className="mb-4">Waiting for Instagram posts to be generated...</p>
              <button onClick={handleInstagramPost} className="py-2 px-4 bg-pink-500 hover:bg-pink-600 rounded-md text-white transition-colors">Generate IG Post</button>
            </div>

            <div className="bg-black/40 rounded-2xl p-6 border border-white/10 text-white/90">
              <h3 className="font-semibold mb-2">Twitter / X</h3>
              <p className="mb-4">Waiting for tweets to be generated...</p>
              <button onClick={handleTwitterPost} className="py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded-md text-white transition-colors">Generate Tweet</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Postmaker
