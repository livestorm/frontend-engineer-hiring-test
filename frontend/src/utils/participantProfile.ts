export interface ParticipantProfile {
  name: string
  avatarUrl: string
}

const PROFILE_STORAGE_KEY = 'livestorm-chat-profile-v1'

export const PARTICIPANT_PROFILES: ParticipantProfile[] = [
  { name: 'Ava Martin', avatarUrl: '/avatars/female-1.jpg' },
  { name: 'Mia Laurent', avatarUrl: '/avatars/female-2.jpg' },
  { name: 'Nora Chen', avatarUrl: '/avatars/female-3.jpg' },
  { name: 'Leo Bernard', avatarUrl: '/avatars/male-1.jpg' },
  { name: 'Noah Garcia', avatarUrl: '/avatars/male-2.jpg' },
  { name: 'Eli Morgan', avatarUrl: '/avatars/male-3.jpg' },
  { name: 'Sam Taylor', avatarUrl: '/avatars/male-4.png' },
  { name: 'Theo Moreau', avatarUrl: '/avatars/male-5.jpg' },
  { name: 'Max Wilson', avatarUrl: '/avatars/male-6.jpg' },
]

const FALLBACK_PROFILE = PARTICIPANT_PROFILES[0] as ParticipantProfile

export function getOrCreateParticipantProfile(storage = getBrowserStorage()): ParticipantProfile {
  const storedProfile = readStoredProfile(storage)

  if (storedProfile) {
    return storedProfile
  }

  const profile = getRandomProfile()
  writeStoredProfile(profile, storage)
  return profile
}

export function getAvatarUrlForAuthor(authorName: string): string {
  const directMatch = PARTICIPANT_PROFILES.find((profile) => profile.name === authorName)

  if (directMatch) {
    return directMatch.avatarUrl
  }

  const index = getStableIndex(authorName || 'Anonymous', PARTICIPANT_PROFILES.length)
  return PARTICIPANT_PROFILES[index]?.avatarUrl ?? FALLBACK_PROFILE.avatarUrl
}

function readStoredProfile(storage: Storage | null): ParticipantProfile | null {
  if (!storage) {
    return null
  }

  try {
    const rawProfile = storage.getItem(PROFILE_STORAGE_KEY)

    if (!rawProfile) {
      return null
    }

    const parsedProfile = JSON.parse(rawProfile) as Partial<ParticipantProfile>
    return PARTICIPANT_PROFILES.find(
      (profile) => profile.name === parsedProfile.name && profile.avatarUrl === parsedProfile.avatarUrl,
    ) ?? null
  } catch {
    return null
  }
}

function writeStoredProfile(profile: ParticipantProfile, storage: Storage | null): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Storage can be unavailable in private browsing or restricted test environments.
  }
}

function getRandomProfile(): ParticipantProfile {
  const index = Math.floor(Math.random() * PARTICIPANT_PROFILES.length)
  return PARTICIPANT_PROFILES[index] ?? FALLBACK_PROFILE
}

function getStableIndex(value: string, modulo: number): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash % modulo
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}
