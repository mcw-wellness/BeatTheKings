'use client'

import { HAIR_COLOR_HEX, VALID_HAIR_STYLES, VALID_HAIR_COLORS } from './AvatarPreview'

type HairStyle = (typeof VALID_HAIR_STYLES)[number]
type HairColor = (typeof VALID_HAIR_COLORS)[number]

interface HairSelectorProps {
  hairStyle: HairStyle
  hairColor: HairColor
  onStyleSelect: (style: HairStyle) => void
  onColorSelect: (color: HairColor) => void
}

export function HairSelector({
  hairStyle,
  hairColor,
  onStyleSelect,
  onColorSelect,
}: HairSelectorProps): JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 justify-center flex-wrap">
        {VALID_HAIR_STYLES.map((style) => (
          <button
            key={style}
            onClick={() => onStyleSelect(style)}
            className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition-all ${
              hairStyle === style
                ? 'border-white bg-white/20 text-white'
                : 'border-white/20 text-white/60 hover:border-white/40'
            }`}
          >
            {style}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        {VALID_HAIR_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            style={{ backgroundColor: HAIR_COLOR_HEX[color] }}
            className={`w-7 h-7 rounded-full border-2 transition-all ${
              hairColor === color
                ? 'border-white scale-110'
                : 'border-white/20 hover:border-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
