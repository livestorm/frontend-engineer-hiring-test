import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAvatarUrlForAuthor,
  getOrCreateParticipantProfile,
  PARTICIPANT_PROFILES,
} from './participantProfile'

describe('participantProfile', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates and reuses a browser profile', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const profile = getOrCreateParticipantProfile(window.localStorage)

    expect(profile).toEqual(PARTICIPANT_PROFILES[0])
    expect(getOrCreateParticipantProfile(window.localStorage)).toEqual(profile)
    expect(Math.random).toHaveBeenCalledTimes(1)
  })

  it('uses the matching avatar for known profile names', () => {
    expect(getAvatarUrlForAuthor(PARTICIPANT_PROFILES[2]!.name)).toBe(PARTICIPANT_PROFILES[2]!.avatarUrl)
  })

  it('uses a stable avatar fallback for backend or mock names', () => {
    expect(getAvatarUrlForAuthor('Emma Smith')).toBe(getAvatarUrlForAuthor('Emma Smith'))
    expect(getAvatarUrlForAuthor('Emma Smith')).toContain('/avatars/')
  })
})
