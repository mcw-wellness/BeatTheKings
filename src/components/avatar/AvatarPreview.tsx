'use client'

import { VALID_SKIN_TONES, VALID_HAIR_STYLES, VALID_HAIR_COLORS } from '@/lib/avatar'

interface AvatarPreviewProps {
  skinTone: string
  hairStyle: string
  hairColor: string
  jerseyNumber?: number
}

// Map skin tone names to hex colors
const SKIN_TONE_COLORS: Record<string, string> = {
  light: '#FFE0BD',
  'medium-light': '#F1C27D',
  medium: '#D2A679',
  'medium-dark': '#A67C52',
  dark: '#6F4E37',
}

// Map hair color names to hex colors
const HAIR_COLOR_HEX: Record<string, string> = {
  black: '#1a1a1a',
  brown: '#8B4513',
  blonde: '#FFD700',
  red: '#DC143C',
  gray: '#808080',
  white: '#F5F5F5',
}

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function AvatarPreview({
  skinTone,
  hairStyle,
  hairColor,
  jerseyNumber = 10,
}: AvatarPreviewProps): JSX.Element {
  const skinHex = SKIN_TONE_COLORS[skinTone] || SKIN_TONE_COLORS.medium
  const hairHex = HAIR_COLOR_HEX[hairColor] || HAIR_COLOR_HEX.black
  const skinDark = adjustColor(skinHex, -30)
  const hairDark = adjustColor(hairHex, -30)

  const renderHair = (): JSX.Element => {
    switch (hairStyle) {
      case 'bald':
        return <ellipse cx="150" cy="35" rx="38" ry="18" fill={skinHex} opacity="0.3" />
      case 'short':
        return (
          <g>
            <ellipse cx="150" cy="30" rx="42" ry="25" fill={hairHex} />
            <ellipse cx="150" cy="32" rx="40" ry="23" fill={hairDark} />
          </g>
        )
      case 'medium':
        return (
          <g>
            <ellipse cx="150" cy="28" rx="44" ry="28" fill={hairHex} />
            <ellipse cx="150" cy="32" rx="42" ry="24" fill={hairDark} />
          </g>
        )
      case 'long':
        return (
          <g>
            <ellipse cx="150" cy="30" rx="46" ry="30" fill={hairHex} />
            <path d="M 106 45 Q 100 70 106 95" fill={hairHex} stroke={hairDark} strokeWidth="2" />
            <path d="M 194 45 Q 200 70 194 95" fill={hairHex} stroke={hairDark} strokeWidth="2" />
          </g>
        )
      case 'afro':
        return (
          <g>
            <circle cx="150" cy="35" r="55" fill={hairHex} />
            <circle cx="130" cy="30" r="25" fill={hairDark} opacity="0.5" />
            <circle cx="170" cy="30" r="25" fill={hairDark} opacity="0.5" />
          </g>
        )
      case 'braids':
        return (
          <g>
            <ellipse cx="150" cy="30" rx="42" ry="25" fill={hairHex} />
            {[105, 125, 145, 165, 185].map((x) => (
              <path key={x} d={`M ${x} 40 Q ${x - 3} 80 ${x} 110`} stroke={hairDark} strokeWidth="4" fill="none" />
            ))}
          </g>
        )
      case 'dreads':
        return (
          <g>
            <ellipse cx="150" cy="30" rx="42" ry="25" fill={hairHex} />
            {[100, 120, 140, 160, 180, 200].map((x, i) => (
              <path key={x} d={`M ${x} 35 Q ${x + (i % 2 ? 5 : -5)} 70 ${x} 100`} stroke={hairHex} strokeWidth="6" fill="none" />
            ))}
          </g>
        )
      case 'mohawk':
        return (
          <g>
            <ellipse cx="150" cy="35" rx="38" ry="18" fill={skinHex} opacity="0.3" />
            <path d="M 145 5 L 150 -10 L 155 5 L 145 5" fill={hairHex} />
            <rect x="145" y="5" width="10" height="35" fill={hairHex} />
          </g>
        )
      default:
        return <ellipse cx="150" cy="30" rx="42" ry="25" fill={hairHex} />
    }
  }

  return (
    <svg width="300" height="380" viewBox="0 0 300 380" className="drop-shadow-xl">
      <defs>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={skinHex} />
          <stop offset="100%" stopColor={skinDark} />
        </linearGradient>
      </defs>
      {/* Hair */}
      {renderHair()}
      {/* Head */}
      <circle cx="150" cy="60" r="38" fill="url(#skinGrad)" stroke="#000" strokeWidth="1.5" />
      {/* Ears */}
      <ellipse cx="112" cy="65" rx="8" ry="12" fill={skinHex} stroke="#000" strokeWidth="1" />
      <ellipse cx="188" cy="65" rx="8" ry="12" fill={skinHex} stroke="#000" strokeWidth="1" />
      {/* Eyes */}
      <ellipse cx="135" cy="58" rx="5" ry="6" fill="#FFF" stroke="#000" strokeWidth="1" />
      <ellipse cx="165" cy="58" rx="5" ry="6" fill="#FFF" stroke="#000" strokeWidth="1" />
      <circle cx="135" cy="59" r="3" fill="#000" />
      <circle cx="165" cy="59" r="3" fill="#000" />
      {/* Smile */}
      <path d="M 135 78 Q 150 88 165 78" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <rect x="135" y="95" width="30" height="15" fill="url(#skinGrad)" stroke="#000" strokeWidth="1" />
      {/* Jersey */}
      <rect x="100" y="108" width="100" height="85" fill="#4361EE" stroke="#000" strokeWidth="2" rx="5" />
      <text x="150" y="160" fontSize="36" fontWeight="bold" fill="#FFF" textAnchor="middle" stroke="#000" strokeWidth="0.5">
        {jerseyNumber}
      </text>
      {/* Arms */}
      <ellipse cx="85" cy="145" rx="16" ry="45" fill="url(#skinGrad)" stroke="#000" strokeWidth="1.5" />
      <ellipse cx="215" cy="145" rx="16" ry="45" fill="url(#skinGrad)" stroke="#000" strokeWidth="1.5" />
      {/* Shorts */}
      <path d="M 100 193 L 95 245 L 140 245 L 145 193 Z" fill="#3651DE" stroke="#000" strokeWidth="2" />
      <path d="M 155 193 L 160 245 L 205 245 L 200 193 Z" fill="#3651DE" stroke="#000" strokeWidth="2" />
      {/* Legs */}
      <rect x="100" y="245" width="28" height="80" fill="url(#skinGrad)" stroke="#000" strokeWidth="1.5" rx="8" />
      <rect x="172" y="245" width="28" height="80" fill="url(#skinGrad)" stroke="#000" strokeWidth="1.5" rx="8" />
      {/* Shoes */}
      <ellipse cx="114" cy="340" rx="22" ry="25" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
      <ellipse cx="186" cy="340" rx="22" ry="25" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
    </svg>
  )
}

export { SKIN_TONE_COLORS, HAIR_COLOR_HEX, VALID_SKIN_TONES, VALID_HAIR_STYLES, VALID_HAIR_COLORS }
