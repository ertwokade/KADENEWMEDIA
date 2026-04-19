import { useState } from 'react'
import { FaYoutube } from 'react-icons/fa'
import './LazyYouTubeEmbed.css'

export default function LazyYouTubeEmbed({ title = 'YouTube video', channelUrl, embedSrc, thumbnail = '/og-image.svg' }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="lazy-youtube">
      {loaded ? (
        <iframe
          src={embedSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button className="lazy-youtube-thumb" onClick={() => setLoaded(true)} aria-label={`${title} oynat`}>
          <img src={thumbnail} alt="" loading="lazy" />
          <span className="lazy-youtube-play">
            <FaYoutube size={34} />
          </span>
          <span className="lazy-youtube-copy">Videoyu yükle ve oynat</span>
        </button>
      )}
      {channelUrl && (
        <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="lazy-youtube-channel">
          Kanalı aç
        </a>
      )}
    </div>
  )
}
