import { describe, expect, it } from 'vitest'
import { formatMessageTime } from './messageFormatting'

describe('formatMessageTime', () => {
  it('renders messages from the last minute as Just now', () => {
    const messageDate = new Date(2026, 3, 21, 16, 5, 56)
    const now = new Date(2026, 3, 21, 16, 6, 40)

    expect(formatMessageTime(messageDate.getTime() / 1000, now)).toBe('Just now')
  })

  it('renders same-day timestamps as local absolute time instead of relative text', () => {
    const messageDate = new Date(2026, 3, 21, 16, 5, 56)
    const now = new Date(2026, 3, 21, 18, 20, 0)

    expect(formatMessageTime(messageDate.getTime() / 1000, now)).toBe('16:05')
  })

  it('uses the local calendar day when deciding whether to include the date', () => {
    const messageDate = new Date(2026, 3, 20, 22, 15, 0)
    const now = new Date(2026, 3, 21, 18, 0, 0)

    expect(formatMessageTime(messageDate.getTime() / 1000, now)).toBe('Apr 20, 22:15')
  })
})
