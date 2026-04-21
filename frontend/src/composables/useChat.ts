import { computed, getCurrentInstance, onBeforeUnmount, readonly, ref, shallowRef } from 'vue'
import { ChatSocket, type ChatClient } from '../services/chatSocket'
import {
  DEFAULT_CHAT_URL,
  MAX_MESSAGE_LENGTH,
  MAX_STORED_MESSAGES,
  type ChatMessage,
  type ConnectionStatus,
} from '../types/chat'
import { isWithinMessageLimit } from '../utils/messageLimits'
import { getOrCreateParticipantProfile } from '../utils/participantProfile'

export interface UseChatOptions {
  socketUrl?: string
  authorName?: string
  client?: ChatClient
  autoConnect?: boolean
}

const RECONNECT_DELAYS = [500, 1000, 2000, 5000] as const

export function useChat(options: UseChatOptions = {}) {
  const authorName = options.authorName ?? getOrCreateParticipantProfile().name
  const socketUrl = options.socketUrl ?? import.meta.env.VITE_CHAT_WS_URL ?? DEFAULT_CHAT_URL
  const client = options.client ?? new ChatSocket(socketUrl)
  const status = ref<ConnectionStatus>('idle')
  const errorMessage = ref('')
  const messagesById = shallowRef(new Map<string, ChatMessage>())
  const messageIds = shallowRef<string[]>([])
  const pendingMessages: ChatMessage[] = []
  const pendingReactionMessages: ChatMessage[] = []
  let flushScheduled = false
  let reconnectTimer: ReturnType<typeof window.setTimeout> | null = null
  let reconnectAttempt = 0
  let manuallyClosed = false

  const messages = computed(() =>
    messageIds.value
      .map((messageId) => messagesById.value.get(messageId))
      .filter((message): message is ChatMessage => Boolean(message)),
  )

  const canSend = computed(() => status.value === 'connected')

  function connect(): void {
    manuallyClosed = false
    status.value = reconnectAttempt > 0 ? 'reconnecting' : 'connecting'
    client.connect()
  }

  function disconnect(): void {
    manuallyClosed = true
    clearReconnectTimer()
    client.disconnect()
    status.value = 'disconnected'
  }

  function sendMessage(rawText: string): boolean {
    const text = rawText.trim()

    if (!text) {
      errorMessage.value = 'Write a message before sending.'
      return false
    }

    if (!isWithinMessageLimit(text)) {
      errorMessage.value = `Messages are limited to ${MAX_MESSAGE_LENGTH} UTF-8 bytes.`
      return false
    }

    if (!canSend.value) {
      errorMessage.value = 'Chat is reconnecting. Try again in a moment.'
      return false
    }

    errorMessage.value = ''
    client.sendMessage(text, authorName)
    return true
  }

  function toggleReaction(messageId: string, emoji: string): void {
    if (!canSend.value) {
      errorMessage.value = 'Chat is reconnecting. Try again in a moment.'
      return
    }

    client.addReaction(messageId, emoji)
  }

  function clearError(): void {
    errorMessage.value = ''
  }

  function queueMessage(message: ChatMessage, replaceExisting: boolean): void {
    if (replaceExisting) {
      pendingReactionMessages.push(message)
    } else {
      pendingMessages.push(message)
    }

    if (!flushScheduled) {
      flushScheduled = true
      queueMicrotask(flushMessages)
    }
  }

  function flushMessages(): void {
    flushScheduled = false

    if (pendingMessages.length === 0 && pendingReactionMessages.length === 0) {
      return
    }

    const nextMessagesById = new Map(messagesById.value)
    const nextMessageIds = [...messageIds.value]

    for (const message of pendingMessages.splice(0)) {
      if (!nextMessagesById.has(message.id)) {
        nextMessageIds.push(message.id)
      }

      nextMessagesById.set(message.id, normalizeMessage(message))
    }

    for (const message of pendingReactionMessages.splice(0)) {
      if (!nextMessagesById.has(message.id)) {
        nextMessageIds.push(message.id)
      }

      nextMessagesById.set(message.id, normalizeMessage(message))
    }

    if (nextMessageIds.length > MAX_STORED_MESSAGES) {
      const removedMessageIds = nextMessageIds.splice(0, nextMessageIds.length - MAX_STORED_MESSAGES)
      removedMessageIds.forEach((messageId) => {
        nextMessagesById.delete(messageId)
      })
    }

    messagesById.value = nextMessagesById
    messageIds.value = nextMessageIds
  }

  function scheduleReconnect(): void {
    if (manuallyClosed) {
      return
    }

    const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)]
    reconnectAttempt += 1
    status.value = 'reconnecting'
    clearReconnectTimer()
    reconnectTimer = window.setTimeout(connect, delay)
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const removeListeners = [
    client.on('open', () => {
      reconnectAttempt = 0
      clearReconnectTimer()
      status.value = 'connected'
      errorMessage.value = ''
    }),
    client.on('close', () => {
      status.value = 'disconnected'
      scheduleReconnect()
    }),
    client.on('message', (message) => {
      queueMessage(message, false)
    }),
    client.on('reactionUpdated', (event) => {
      queueMessage(event.message, true)
    }),
    client.on('error', (message) => {
      errorMessage.value = message
    }),
  ]

  if (options.autoConnect !== false) {
    connect()
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      removeListeners.forEach((removeListener) => removeListener())
      disconnect()
    })
  }

  return {
    status: readonly(status),
    errorMessage: readonly(errorMessage),
    messages,
    canSend,
    sendMessage,
    toggleReaction,
    clearError,
    connect,
    disconnect,
  }
}

function normalizeMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    reactions: message.reactions ?? {},
  }
}
