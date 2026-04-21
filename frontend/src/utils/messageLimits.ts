import { MAX_MESSAGE_LENGTH } from '../types/chat'

const textEncoder = new TextEncoder()

export function getServerMessageLength(text: string): number {
  return textEncoder.encode(text).length
}

export function getRemainingMessageLength(text: string): number {
  return MAX_MESSAGE_LENGTH - getServerMessageLength(text.trim())
}

export function isWithinMessageLimit(text: string): boolean {
  return getRemainingMessageLength(text) >= 0
}
