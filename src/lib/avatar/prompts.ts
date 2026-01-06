/**
 * Avatar Generation Prompts
 * Re-exports prompt functions from gemini module
 */

export {
  buildAvatarPrompt,
  buildDefaultAvatarPrompt,
  calculateAgeGroup,
  DEFAULT_AVATARS,
} from '@/lib/gemini'

export type { AvatarPromptInput, AgeGroup } from '@/lib/gemini'
