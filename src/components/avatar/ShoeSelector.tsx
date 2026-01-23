'use client'

import Image from 'next/image'

export interface ShoeItem {
  id: string
  name: string
  imageUrl: string | null
  isDefault: boolean
  isUnlocked: boolean
  canUnlock: boolean
  requiredMatches: number | null
  requiredChallenges: number | null
  requiredXp: number | null
  rpCost: number | null
}

interface ShoeSelectorProps {
  shoes: ShoeItem[]
  selectedShoeId: string | null
  isUnlocking: boolean
  onSelect: (shoeId: string) => void
  onUnlock: (shoeId: string) => void
}

export function ShoeSelector({
  shoes,
  selectedShoeId,
  isUnlocking,
  onSelect,
  onUnlock,
}: ShoeSelectorProps): JSX.Element {
  if (shoes.length === 0) {
    return <div className="text-center text-white/40 text-sm py-4">Loading shoes...</div>
  }

  const selectedShoe = shoes.find((s) => s.id === selectedShoeId)

  return (
    <div className="space-y-3">
      {/* Preview of selected item */}
      {selectedShoe?.imageUrl && (
        <div className="flex justify-center">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/10 border border-white/20">
            <Image
              src={selectedShoe.imageUrl}
              alt={selectedShoe.name}
              fill
              className="object-contain p-1"
            />
          </div>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2 max-h-[120px] overflow-y-auto">
        {shoes.map((shoe) => {
          const isSelected = selectedShoeId === shoe.id
          const isLocked = !shoe.isUnlocked && !shoe.isDefault
          const canUnlock = shoe.canUnlock && !shoe.isUnlocked

          return (
            <div
              key={shoe.id}
              onClick={() => {
                if (shoe.isUnlocked || shoe.isDefault) {
                  onSelect(shoe.id)
                } else if (canUnlock && !isUnlocking) {
                  onUnlock(shoe.id)
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
                {shoe.imageUrl ? (
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-white/5">
                    <Image
                      src={shoe.imageUrl}
                      alt={shoe.name}
                      fill
                      className={`object-contain ${isLocked ? 'opacity-40' : ''}`}
                    />
                  </div>
                ) : (
                  <span className="text-lg w-8 text-center">{isLocked ? '🔒' : '👟'}</span>
                )}
                <div>
                  <p className={`text-sm font-medium ${isLocked ? 'text-white/50' : 'text-white'}`}>
                    {shoe.name}
                  </p>
                  {isLocked && <p className="text-xs text-white/40">{formatRequirement(shoe)}</p>}
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

function formatRequirement(shoe: ShoeItem): string {
  if (shoe.requiredChallenges) return `${shoe.requiredChallenges} challenges`
  if (shoe.requiredMatches) return `${shoe.requiredMatches} matches`
  if (shoe.requiredXp) return `${shoe.requiredXp} XP`
  if (shoe.rpCost) return `${shoe.rpCost} RP`
  return ''
}
