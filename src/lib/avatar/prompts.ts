/**
 * Avatar Generation Prompts
 * Re-exports prompt functions from gemini module
 * NOTE: Import directly from prompts.ts to avoid pulling in avatar.ts (which uses Node.js fs)
 */

export {
  buildAvatarPrompt,
  buildDefaultAvatarPrompt,
  calculateAgeGroup,
  DEFAULT_AVATARS,
} from '@/lib/gemini/prompts'

export type { AvatarPromptInput, AgeGroup } from '@/lib/gemini/types'
