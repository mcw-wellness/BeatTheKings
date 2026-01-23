'use client'

const JERSEY_COLORS = [
  { name: 'Navy', value: '#1a1a4e' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#1f2937' },
  { name: 'Purple', value: '#7c3aed' },
]

interface JerseyNumberInputProps {
  jerseyNumber: string
  onChange: (value: string) => void
}

export function JerseyNumberInput({ jerseyNumber, onChange }: JerseyNumberInputProps): JSX.Element {
  return (
    <div className="flex justify-center">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={jerseyNumber}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 2)
          onChange(val)
        }}
        onBlur={() => {
          if (jerseyNumber === '') onChange('0')
        }}
        className="w-24 text-center text-4xl font-bold py-3 bg-white/10 border-2 border-white/30 rounded-lg text-white focus:border-white focus:outline-none"
      />
    </div>
  )
}

interface JerseyColorSelectorProps {
  jerseyColor: string
  onSelect: (color: string) => void
}

export function JerseyColorSelector({
  jerseyColor,
  onSelect,
}: JerseyColorSelectorProps): JSX.Element {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {JERSEY_COLORS.map((color) => (
        <button
          key={color.value}
          onClick={() => onSelect(color.value)}
          style={{ backgroundColor: color.value }}
          className={`w-12 h-12 rounded-full border-2 transition-all ${
            jerseyColor === color.value
              ? 'border-white scale-110'
              : 'border-white/20 hover:border-white/40'
          } ${color.value === '#ffffff' ? 'border-white/40' : ''}`}
          title={color.name}
        />
      ))}
    </div>
  )
}
