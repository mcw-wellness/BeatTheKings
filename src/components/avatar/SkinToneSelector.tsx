'use client'

import { SKIN_TONE_COLORS, VALID_SKIN_TONES } from './AvatarPreview'

type SkinTone = (typeof VALID_SKIN_TONES)[number]

interface SkinToneSelectorProps {
  skinTone: SkinTone
  onSelect: (tone: SkinTone) => void
}

export function SkinToneSelector({ skinTone, onSelect }: SkinToneSelectorProps): JSX.Element {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {VALID_SKIN_TONES.map((tone) => (
        <button
          key={tone}
          onClick={() => onSelect(tone)}
          style={{ backgroundColor: SKIN_TONE_COLORS[tone] }}
          className={`w-12 h-12 rounded-full border-2 transition-all ${
            skinTone === tone ? 'border-white scale-110' : 'border-white/20 hover:border-white/40'
          }`}
        />
      ))}
    </div>
  )
}
