'use client'

import Image from 'next/image'

export interface JerseyItem {
  id: string
  name: string
  imageUrl: string | null
  isDefault: boolean
  isUnlocked: boolean
  canUnlock: boolean
  requiredMatches: number | null
  requiredChallenges: number | null
  requiredInvites: number | null
  requiredXp: number | null
  rpCost: number | null
}

interface JerseyUnlockSelectorProps {
  jerseys: JerseyItem[]
  selectedJerseyId: string | null
  isUnlocking: boolean
  onSelect: (jerseyId: string) => void
  onUnlock: (jerseyId: string) => void
}

export function JerseyUnlockSelector({
  jerseys,
  selectedJerseyId,
  isUnlocking,
  onSelect,
  onUnlock,
}: JerseyUnlockSelectorProps): JSX.Element {
  if (jerseys.length === 0) {
    return <div className="text-center text-white/40 text-sm py-4">Loading jerseys...</div>
  }

  const selectedJersey = jerseys.find((j) => j.id === selectedJerseyId)

  return (
    <div className="space-y-3">
      {/* Preview of selected item */}
      {selectedJersey?.imageUrl && (
        <div className="flex justify-center">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/10 border border-white/20">
            <Image
              src={selectedJersey.imageUrl}
              alt={selectedJersey.name}
              fill
              className="object-contain p-1"
            />
          </div>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2 max-h-[120px] overflow-y-auto">
        {jerseys.map((jersey) => {
          const isSelected = selectedJerseyId === jersey.id
          const isLocked = !jersey.isUnlocked && !jersey.isDefault
          const canUnlock = jersey.canUnlock && !jersey.isUnlocked

          return (
            <div
              key={jersey.id}
              onClick={() => {
                if (jersey.isUnlocked || jersey.isDefault) {
                  onSelect(jersey.id)
                } else if (canUnlock && !isUnlocking) {
                  onUnlock(jersey.id)
                }
              }}
              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'border-white bg-white/20'
                  : isLocked
                    ? 'border-white/10 bg-white/5 opacity-60'
                    : 'border-white/20 bg-white/10 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center gap-2">
                {jersey.imageUrl ? (
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-white/5">
                    <Image
                      src={jersey.imageUrl}
                      alt={jersey.name}
                      fill
                      className={`object-contain ${isLocked ? 'opacity-40' : ''}`}
                    />
                  </div>
                ) : (
                  <span className="text-lg w-8 text-center">{isLocked ? '🔒' : '👕'}</span>
                )}
                <div>
                  <p className={`text-sm font-medium ${isLocked ? 'text-white/50' : 'text-white'}`}>
                    {jersey.name}
                  </p>
                  {isLocked && <p className="text-xs text-white/40">{formatRequirement(jersey)}</p>}
                </div>
              </div>
              {isSelected && <span className="text-green-400">✓</span>}
              {canUnlock && !isSelected && (
                <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded">
                  {isUnlocking ? '...' : 'Unlock'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatRequirement(jersey: JerseyItem): string {
  if (jersey.requiredChallenges) return `${jersey.requiredChallenges} challenges`
  if (jersey.requiredMatches) return `${jersey.requiredMatches} matches`
  if (jersey.requiredInvites) return `${jersey.requiredInvites} invites`
  if (jersey.requiredXp) return `${jersey.requiredXp} XP`
  if (jersey.rpCost) return `${jersey.rpCost} RP`
  return ''
}
