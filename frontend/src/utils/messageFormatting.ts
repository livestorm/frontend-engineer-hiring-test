import type { ChatMessage, ReactionSummary } from '../types/chat'

export interface MessageTextSegment {
  text: string
  isEmoji: boolean
}

export function getInitials(authorName: string): string {
  const words = authorName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatMessageTime(timestampInSeconds: number, now = new Date()): string {
  const messageDate = new Date(timestampInSeconds * 1000)
  const secondsAgo = Math.floor((now.getTime() - messageDate.getTime()) / 1000)

  if (secondsAgo >= 0 && secondsAgo < 60) {
    return 'Just now'
  }

  if (messageDate.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(messageDate)
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(messageDate)
}

export function getMessageTextSegments(text: string): MessageTextSegment[] {
  const emojiPattern =
    /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\p{Emoji_Modifier}|\uFE0F|\uFE0E)*(?:\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\p{Emoji_Modifier}|\uFE0F|\uFE0E)*)*/gu
  const segments: MessageTextSegment[] = []
  let lastIndex = 0
  let match = emojiPattern.exec(text)

  while (match) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        isEmoji: false,
      })
    }

    segments.push({
      text: match[0],
      isEmoji: true,
    })

    lastIndex = match.index + match[0].length
    match = emojiPattern.exec(text)
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isEmoji: false,
    })
  }

  return segments.length > 0 ? segments : [{ text, isEmoji: false }]
}

export function getReactionSummaries(reactions: ChatMessage['reactions']): ReactionSummary[] {
  return Object.entries(reactions)
    .map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
    }))
    .filter((reaction) => reaction.count > 0)
}
