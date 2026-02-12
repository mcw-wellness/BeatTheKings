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
  highlight,
  badge,
}: {
  icon: string
  label: string
  locked: boolean
  onClick: () => void
  highlight?: boolean
  badge?: number
}): JSX.Element {
  return (
    <div className="relative">
      {highlight && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          <div className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
            👆 Tap here next!
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-green-500" />
          </div>
        </div>
      )}
      <button
        onClick={locked ? undefined : onClick}
        disabled={locked}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
          highlight
            ? 'bg-green-500/20 border-green-400 ring-2 ring-green-400 ring-offset-2 ring-offset-transparent animate-pulse'
            : locked
              ? 'bg-[#1e2a4a]/60 border-white/10 cursor-not-allowed'
              : 'bg-[#1e2a4a]/80 border-white/20 hover:bg-[#1e2a4a] active:scale-98'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className={`text-sm font-medium ${locked ? 'text-white/40' : 'text-white'}`}>
            {label}
          </span>
        </div>
        {locked ? (
          <span className="text-white/40">🔒</span>
        ) : badge && badge > 0 ? (
          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {badge}
          </span>
        ) : null}
      </button>
    </div>
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
    <div
      className="h-full flex items-center justify-center cursor-pointer"
      onClick={onClick}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white" />
        </div>
      ) : avatarUrl ? (
        <div className="relative flex items-center justify-center">
          {isKing && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
              <span className="text-5xl">👑</span>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Your Avatar"
            className="h-[380px] w-auto object-contain"
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
  totalXp: number
  totalRp: number
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
  totalXp,
  totalRp,
  winRate,
  rank,
  level,
  xpInLevel,
  xpForNextLevel,
  xpProgress,
  challengesCompleted,
}: StatsPanelsProps): JSX.Element {
  return (
    <div className="flex flex-col justify-center gap-3 pl-2">
      <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-3 border border-white/10">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
          Performance <span className="text-yellow-400 font-bold">{totalXp} XP</span>
        </h3>
        <div className="space-y-3">
          <StatRow icon="🏆" label="Total Points" value={totalPoints.toString()} />
          <StatRow icon="🎯" label="Win Rate" value={`${winRate}%`} />
          <StatRow icon="📊" label="Ranking" value={rank ? `#${rank}` : '#--'} />
        </div>
      </div>
      <div className="bg-[#1e2a4a]/90 backdrop-blur rounded-xl p-3 border border-white/10">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
          Progression <span className="text-green-400 font-bold">{totalRp} RP</span>
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
  highlightMap?: boolean
  matchInvitationCount?: number
}

export function NavigationGrid({ hasCreatedAvatar, onNavigate, highlightMap, matchInvitationCount }: NavigationGridProps): JSX.Element {
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
          highlight={highlightMap}
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
          badge={matchInvitationCount}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#1e2a4a]/80 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-white/60">🏀 BB Championship</p>
        </div>
        <div className="bg-[#1e2a4a]/80 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-white/60">🏋️ Practice</p>
        </div>
      </div>
    </div>
  )
}
