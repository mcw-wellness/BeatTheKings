'use client'

export function StatRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-white/70">{label}</span>
      </div>
      <span className="text-base font-bold text-white">{value}</span>
    </div>
  )
}

export function NavButton({
  icon,
  label,
  locked,
  onClick,
}: {
  icon: string
  label: string
  locked: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${locked ? 'bg-[#1e2a4a]/60 border-white/10 cursor-not-allowed' : 'bg-[#1e2a4a]/80 border-white/20 hover:bg-[#1e2a4a] active:scale-98'}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-sm font-medium ${locked ? 'text-white/40' : 'text-white'}`}>
          {label}
        </span>
      </div>
      {locked && <span className="text-white/40">🔒</span>}
    </button>
  )
}

interface AvatarDisplayProps {
  isLoading: boolean
  avatarUrl: string | null
  isKing: boolean
  onClick: () => void
}

export function AvatarDisplay({
  isLoading,
  avatarUrl,
  isKing,
  onClick,
}: AvatarDisplayProps): JSX.Element {
  return (
    <div className="w-[55%] flex items-center justify-center cursor-pointer" onClick={onClick}>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white" />
        </div>
      ) : avatarUrl ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {isKing && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
              <span className="text-5xl">👑</span>
            </div>
          )}
          {/* Use img tag for more reliable sizing with dynamic images */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Your Avatar"
            className="max-w-full max-h-full object-contain"
            style={{ minHeight: '200px' }}
          />
        </div>
      ) : (
        <div className="text-center text-white/50 pb-20">
          <p>Tap to customize avatar</p>
        </div>
      )}
    </div>
  )
}

interface StatsPanelsProps {
  totalPoints: number
  winRate: number
  rank: number | null
  level: number
  xpInLevel: number
  xpForNextLevel: number
  xpProgress: number
  challengesCompleted: number
}

export function StatsPanels({
  totalPoints,
  winRate,
  rank,
  level,
  xpInLevel,
  xpForNextLevel,
  xpProgress,
  challengesCompleted,
}: StatsPanelsProps): JSX.Element {
  return (
    <div className="w-[45%] flex flex-col justify-center gap-3 pl-2">
      <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-3 border border-white/10">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
          Performance
        </h3>
        <div className="space-y-3">
          <StatRow icon="🏆" label="Total Points" value={totalPoints.toString()} />
          <StatRow icon="🎯" label="Win Rate" value={`${winRate}%`} />
          <StatRow icon="📊" label="Ranking" value={rank ? `#${rank}` : '#--'} />
        </div>
      </div>
      <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-3 border border-white/10">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
          Progression
        </h3>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-base font-bold text-white">LEVEL {level}</span>
            <span className="text-xs text-white/50">
              {xpInLevel} / {xpForNextLevel}
            </span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
              style={{ width: `${Math.min(xpProgress, 100)}%` }}
            />
          </div>
        </div>
        <div className="space-y-3">
          <StatRow icon="⚡" label="Challenges" value={`${challengesCompleted}/13`} />
          <StatRow icon="⭐" label="Badges" value="0/3" />
        </div>
      </div>
    </div>
  )
}

interface NavigationGridProps {
  hasCreatedAvatar: boolean
  onNavigate: (path: string) => void
}

export function NavigationGrid({ hasCreatedAvatar, onNavigate }: NavigationGridProps): JSX.Element {
  return (
    <div className="px-4 pb-4 pt-2 shrink-0 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <NavButton
          icon="🏆"
          label="Challenges"
          locked={!hasCreatedAvatar}
          onClick={() => onNavigate('/challenges')}
        />
        <NavButton
          icon="🗺️"
          label="Map"
          locked={!hasCreatedAvatar}
          onClick={() => onNavigate('/map')}
        />
        <NavButton
          icon="⚔️"
          label="Rankings"
          locked={!hasCreatedAvatar}
          onClick={() => onNavigate('/ranking')}
        />
        <NavButton
          icon="🤝"
          label="My Matches"
          locked={!hasCreatedAvatar}
          onClick={() => onNavigate('/matches')}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#1e2a4a]/80 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-white/60">🏀 BB Championship</p>
        </div>
        <div className="bg-[#1e2a4a]/80 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-white/60">COMING SOON</p>
        </div>
      </div>
    </div>
  )
}
