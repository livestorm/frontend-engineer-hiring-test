export const MAX_MESSAGE_LENGTH = 500
export const MAX_STORED_MESSAGES = 1000
export const DEFAULT_CHAT_URL = 'ws://localhost:8080/ws'
export const COMMON_REACTIONS = ['😂', '👏', '💡', '🥰', '👍', '❤️', '🎉'] as const

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export interface ChatMessage {
  id: string
  text: string
  author_id: string
  author_name: string
  created_at: number
  reactions: Record<string, string[]>
}

export interface ReactionUpdatedPayload {
  message_id: string
  emoji: string
  user_id: string
  action: 'added' | 'removed'
  message: ChatMessage
}

export type ServerMessage =
  | {
      type: 'message'
      data: ChatMessage
    }
  | {
      type: 'reaction_updated'
      data: ReactionUpdatedPayload
    }
  | {
      type: 'error'
      data: {
        error: string
      }
    }

export type ClientMessage =
  | {
      type: 'send_message'
      data: {
        text: string
        author_name: string
      }
    }
  | {
      type: 'add_reaction'
      data: {
        message_id: string
        emoji: string
      }
    }

export interface ReactionSummary {
  emoji: string
  count: number
}
