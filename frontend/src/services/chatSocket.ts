import type { ChatMessage, ClientMessage, ReactionUpdatedPayload, ServerMessage } from '../types/chat'

export interface ChatSocketEventMap {
  open: void
  close: CloseEvent
  message: ChatMessage
  reactionUpdated: ReactionUpdatedPayload
  error: string
}

type ChatSocketEventName = keyof ChatSocketEventMap
type ChatSocketListener<TEventName extends ChatSocketEventName> = (payload: ChatSocketEventMap[TEventName]) => void

export type WebSocketFactory = (url: string) => WebSocket

export interface ChatClient {
  connect(): void
  disconnect(): void
  sendMessage(text: string, authorName: string): void
  addReaction(messageId: string, emoji: string): void
  on<TEventName extends ChatSocketEventName>(
    eventName: TEventName,
    listener: ChatSocketListener<TEventName>,
  ): () => void
}

export class ChatSocket implements ChatClient {
  private socket: WebSocket | null = null
  private readonly listeners = new Map<ChatSocketEventName, Set<ChatSocketListener<ChatSocketEventName>>>()
  private readonly url: string
  private readonly createWebSocket: WebSocketFactory

  constructor(
    url: string,
    createWebSocket: WebSocketFactory = (socketUrl) => new WebSocket(socketUrl),
  ) {
    this.url = url
    this.createWebSocket = createWebSocket
  }

  connect(): void {
    this.disconnect()

    let nextSocket: WebSocket

    try {
      nextSocket = this.createWebSocket(this.url)
    } catch {
      this.emit('error', 'Unable to start the chat connection.')
      this.emit('close', new CloseEvent('close'))
      return
    }

    this.socket = nextSocket

    nextSocket.addEventListener('open', this.handleOpen)
    nextSocket.addEventListener('close', this.handleClose)
    nextSocket.addEventListener('message', this.handleMessage)
    nextSocket.addEventListener('error', this.handleSocketError)
  }

  disconnect(): void {
    if (!this.socket) {
      return
    }

    const currentSocket = this.socket
    this.socket = null
    this.detachSocket(currentSocket)

    if (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING) {
      currentSocket.close()
    }
  }

  sendMessage(text: string, authorName: string): void {
    this.send({
      type: 'send_message',
      data: {
        text,
        author_name: authorName,
      },
    })
  }

  addReaction(messageId: string, emoji: string): void {
    this.send({
      type: 'add_reaction',
      data: {
        message_id: messageId,
        emoji,
      },
    })
  }

  on<TEventName extends ChatSocketEventName>(
    eventName: TEventName,
    listener: ChatSocketListener<TEventName>,
  ): () => void {
    const listeners = this.listeners.get(eventName) ?? new Set()
    listeners.add(listener as ChatSocketListener<ChatSocketEventName>)
    this.listeners.set(eventName, listeners)

    return () => {
      listeners.delete(listener as ChatSocketListener<ChatSocketEventName>)
    }
  }

  private send(message: ClientMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.emit('error', 'Chat connection is not ready yet.')
      return
    }

    try {
      this.socket.send(JSON.stringify(message))
    } catch {
      this.emit('error', 'Unable to send the chat event.')
    }
  }

  private readonly handleOpen = (event: Event): void => {
    if (event.target !== this.socket) {
      return
    }

    this.emit('open', undefined)
  }

  private readonly handleClose = (event: CloseEvent): void => {
    const currentSocket = this.socket

    if (!currentSocket || event.target !== currentSocket) {
      return
    }

    this.detachSocket(currentSocket)
    this.socket = null
    this.emit('close', event)
  }

  private readonly handleSocketError = (event: Event): void => {
    if (event.target !== this.socket) {
      return
    }

    this.emit('error', 'Unable to reach the chat server.')
  }

  private readonly handleMessage = (event: MessageEvent<string>): void => {
    if (event.target !== this.socket) {
      return
    }

    const parsedMessage = parseServerMessage(event.data)

    if (!parsedMessage) {
      this.emit('error', 'Received an unsupported chat event.')
      return
    }

    switch (parsedMessage.type) {
      case 'message':
        this.emit('message', parsedMessage.data)
        break
      case 'reaction_updated':
        this.emit('reactionUpdated', parsedMessage.data)
        break
      case 'error':
        this.emit('error', parsedMessage.data.error)
        break
    }
  }

  private emit<TEventName extends ChatSocketEventName>(
    eventName: TEventName,
    payload: ChatSocketEventMap[TEventName],
  ): void {
    this.listeners.get(eventName)?.forEach((listener) => {
      listener(payload)
    })
  }

  private detachSocket(socket: WebSocket): void {
    socket.removeEventListener('open', this.handleOpen)
    socket.removeEventListener('close', this.handleClose)
    socket.removeEventListener('message', this.handleMessage)
    socket.removeEventListener('error', this.handleSocketError)
  }
}

export function parseServerMessage(payload: string): ServerMessage | null {
  try {
    const parsed = JSON.parse(payload) as unknown

    if (!isRecord(parsed) || typeof parsed.type !== 'string' || !isRecord(parsed.data)) {
      return null
    }

    if (parsed.type === 'message' && isChatMessage(parsed.data)) {
      return {
        type: 'message',
        data: parsed.data,
      }
    }

    if (parsed.type === 'reaction_updated' && isReactionUpdatedPayload(parsed.data)) {
      return {
        type: 'reaction_updated',
        data: parsed.data,
      }
    }

    if (parsed.type === 'error' && typeof parsed.data.error === 'string') {
      return {
        type: 'error',
        data: {
          error: parsed.data.error,
        },
      }
    }
  } catch {
    return null
  }

  return null
}

function isReactionUpdatedPayload(value: unknown): value is ReactionUpdatedPayload {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.message_id === 'string' &&
    typeof value.emoji === 'string' &&
    typeof value.user_id === 'string' &&
    (value.action === 'added' || value.action === 'removed') &&
    isRecord(value.message) &&
    isChatMessage(value.message)
  )
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.author_id === 'string' &&
    typeof value.author_name === 'string' &&
    typeof value.created_at === 'number' &&
    isReactionMap(value.reactions)
  )
}

function isReactionMap(value: unknown): value is Record<string, string[]> {
  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every(
    (userIds) => Array.isArray(userIds) && userIds.every((userId) => typeof userId === 'string'),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
