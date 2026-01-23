// Avatar validation and types

export const VALID_SKIN_TONES = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'] as const
export const VALID_HAIR_STYLES = [
  'short',
  'medium',
  'long',
  'bald',
  'afro',
  'braids',
  'dreads',
  'mohawk',
] as const
export const VALID_HAIR_COLORS = ['black', 'brown', 'blonde', 'red', 'gray', 'white'] as const

export type SkinTone = (typeof VALID_SKIN_TONES)[number]
export type HairStyle = (typeof VALID_HAIR_STYLES)[number]
export type HairColor = (typeof VALID_HAIR_COLORS)[number]

export interface AvatarCreateInput {
  skinTone: SkinTone
  hairStyle: HairStyle
  hairColor: HairColor
  imageUrl?: string
  photoAnalysis?: string
}

export interface AvatarUpdateInput {
  skinTone?: SkinTone
  hairStyle?: HairStyle
  hairColor?: HairColor
  imageUrl?: string
  photoAnalysis?: string
}

export function validateAvatarInput(
  data: unknown
): { valid: true; data: AvatarCreateInput } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  if (!data || typeof data !== 'object')
    return { valid: false, errors: { _form: 'Invalid request body' } }

  const input = data as Record<string, unknown>

  if (!input.skinTone || typeof input.skinTone !== 'string') {
    errors.skinTone = 'Skin tone is required'
  } else if (!VALID_SKIN_TONES.includes(input.skinTone as SkinTone)) {
    errors.skinTone = `Invalid skin tone. Must be one of: ${VALID_SKIN_TONES.join(', ')}`
  }

  if (!input.hairStyle || typeof input.hairStyle !== 'string') {
    errors.hairStyle = 'Hair style is required'
  } else if (!VALID_HAIR_STYLES.includes(input.hairStyle as HairStyle)) {
    errors.hairStyle = `Invalid hair style. Must be one of: ${VALID_HAIR_STYLES.join(', ')}`
  }

  if (!input.hairColor || typeof input.hairColor !== 'string') {
    errors.hairColor = 'Hair color is required'
  } else if (!VALID_HAIR_COLORS.includes(input.hairColor as HairColor)) {
    errors.hairColor = `Invalid hair color. Must be one of: ${VALID_HAIR_COLORS.join(', ')}`
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: {
      skinTone: input.skinTone as SkinTone,
      hairStyle: input.hairStyle as HairStyle,
      hairColor: input.hairColor as HairColor,
    },
  }
}

export function validateAvatarUpdateInput(
  data: unknown
): { valid: true; data: AvatarUpdateInput } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  if (!data || typeof data !== 'object')
    return { valid: false, errors: { _form: 'Invalid request body' } }

  const input = data as Record<string, unknown>
  const updateData: AvatarUpdateInput = {}

  if (input.skinTone !== undefined) {
    if (typeof input.skinTone !== 'string') errors.skinTone = 'Skin tone must be a string'
    else if (!VALID_SKIN_TONES.includes(input.skinTone as SkinTone))
      errors.skinTone = `Invalid skin tone`
    else updateData.skinTone = input.skinTone as SkinTone
  }

  if (input.hairStyle !== undefined) {
    if (typeof input.hairStyle !== 'string') errors.hairStyle = 'Hair style must be a string'
    else if (!VALID_HAIR_STYLES.includes(input.hairStyle as HairStyle))
      errors.hairStyle = `Invalid hair style`
    else updateData.hairStyle = input.hairStyle as HairStyle
  }

  if (input.hairColor !== undefined) {
    if (typeof input.hairColor !== 'string') errors.hairColor = 'Hair color must be a string'
    else if (!VALID_HAIR_COLORS.includes(input.hairColor as HairColor))
      errors.hairColor = `Invalid hair color`
    else updateData.hairColor = input.hairColor as HairColor
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors }
  if (Object.keys(updateData).length === 0)
    return { valid: false, errors: { _form: 'At least one field is required' } }

  return { valid: true, data: updateData }
}
