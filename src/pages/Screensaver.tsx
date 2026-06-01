import { useEffect, useState } from 'react'
import { Plane } from 'lucide-react'

const Screensaver: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const seconds = currentTime.toLocaleTimeString('en-US', { second: '2-digit' }).replace(/^0/, '')
  const date = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0f] overflow-hidden">

      {/* Subtle radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Thin horizontal rule lines — decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 60px)' }}
      />

      {/* Flying plane trail */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="plane-track absolute top-1/3">
          <Plane className="h-4 w-4 text-white/30 rotate-0" />
          <div className="trail" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 select-none">

        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Plane className="h-4 w-4 text-white -rotate-45" />
          </div>
          <span className="text-white/60 text-sm font-medium tracking-[0.2em] uppercase">Royal Air</span>
        </div>

        {/* Clock */}
        <div className="flex items-end gap-2">
          <span className="text-white font-thin tabular-nums leading-none" style={{ fontSize: 'clamp(5rem, 15vw, 10rem)', letterSpacing: '-0.04em' }}>
            {hours}
          </span>
          <span className="text-white/30 font-thin tabular-nums mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            {seconds}s
          </span>
        </div>

        {/* Date */}
        <p className="text-white/40 text-base font-light tracking-widest uppercase">
          {date}
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-white/10" />

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/30 text-xs tracking-widest uppercase">Session locked</span>
        </div>

      </div>

      <style>{`
        .plane-track {
          animation: plane-fly 18s linear infinite;
          left: -60px;
          display: flex;
          align-items: center;
          gap: 0;
        }
        .trail {
          width: 80px;
          height: 1px;
          background: linear-gradient(to left, transparent, rgba(255,255,255,0.15));
          margin-left: 4px;
        }
        @keyframes plane-fly {
          from { transform: translateX(-60px); }
          to   { transform: translateX(calc(100vw + 60px)); }
        }
      `}</style>
    </div>
  )
}

export default Screensaver
