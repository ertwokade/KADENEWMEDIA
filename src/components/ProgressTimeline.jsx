import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { HiOutlineCheck, HiOutlineClock } from 'react-icons/hi'
import './ProgressTimeline.css'

const timelineData = [
  {
    date: '2018',
    title: 'Başlangıç',
    desc: 'İlk müşteri projesi. Tek kişiyle, küçük bütçelerle sosyal medya yönetimine başlandı.',
    done: true,
  },
  {
    date: '2020',
    title: 'Şirket Kuruluşu',
    desc: 'Kade Media resmi olarak kuruldu. İlk ofis ve ekip büyümesi.',
    done: true,
  },
  {
    date: '2022',
    title: 'Biruni Teknopark',
    desc: 'İstanbul Biruni Teknopark\'ta ofis açıldı. Video prodüksiyon hizmetleri başlatıldı.',
    done: true,
  },
  {
    date: '2023',
    title: '20+ Aktif Müşteri',
    desc: 'Portföy büyüdü, farklı sektörlerden 20+ markaya hizmet verilmeye başlandı.',
    done: true,
  },
  {
    date: '2024',
    title: 'Influencer Marketing',
    desc: 'Influencer kampanya hizmetleri eklendi. İlk büyük marka lansmanları gerçekleşti.',
    done: true,
  },
  {
    date: '2025',
    title: 'Uluslararası Büyüme',
    desc: 'İngilizce hizmet genişlemesi ve uluslararası marka ortaklıkları hedefleniyor.',
    done: false,
  },
  {
    date: '2026',
    title: 'Full Production House',
    desc: 'Tam donanımlı stüdyo ve 360° prodüksiyon kapasitesi.',
    done: false,
  },
]

function TimelineItem({ item, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={`tl-item ${item.done ? 'tl-done' : 'tl-future'}`}
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07 }}
    >
      {/* Line */}
      <div className="tl-line-wrap">
        <motion.div
          className="tl-line-fill"
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.07 + 0.15 }}
        />
      </div>

      {/* Icon */}
      <div className="tl-icon">
        {item.done
          ? <HiOutlineCheck size={14} />
          : <motion.div
              className="tl-loading-ring"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            />
        }
      </div>

      {/* Content */}
      <div className={`tl-content ${!item.done ? 'tl-content-blur' : ''}`}>
        <span className="tl-date">{item.date}</span>
        <h4 className="tl-title">{item.title}</h4>
        <p className="tl-desc">{item.desc}</p>
        {!item.done && <span className="tl-soon-badge">Yakında</span>}
      </div>
    </motion.div>
  )
}

export default function ProgressTimeline() {
  return (
    <div className="tl-wrapper">
      {timelineData.map((item, i) => (
        <TimelineItem key={i} item={item} index={i} />
      ))}
    </div>
  )
}
