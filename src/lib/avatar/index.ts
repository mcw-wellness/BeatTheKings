// Re-export all avatar functions from split files

export {
  VALID_SKIN_TONES,
  VALID_HAIR_STYLES,
  VALID_HAIR_COLORS,
  validateAvatarInput,
  validateAvatarUpdateInput,
  type SkinTone,
  type HairStyle,
  type HairColor,
  type AvatarCreateInput,
  type AvatarUpdateInput,
} from './validation'

export {
  avatarExists,
  getAvatar,
  createAvatar,
  updateAvatarImageUrl,
  updateAvatar,
  updateAvatarPhotoAnalysis,
  markAvatarCreated,
} from './crud'

export {
  getDefaultItems,
  unlockDefaultItems,
  getBasketballSportId,
  createDefaultEquipment,
  upsertEquipment,
  getUserUnlockedItems,
} from './equipment'

export { getAvatarWithStats } from './stats'
