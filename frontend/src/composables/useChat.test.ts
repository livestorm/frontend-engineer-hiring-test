import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { ChatClient, ChatSocketEventMap } from '../services/chatSocket'
import { MAX_STORED_MESSAGES, type ChatMessage } from '../types/chat'
import { PARTICIPANT_PROFILES } from '../utils/participantProfile'
import { useChat } from './useChat'

class FakeChatClient implements ChatClient {
  readonly sentMessages: Array<{ text: string; authorName: string }> = []
  readonly sentReactions: Array<{ messageId: string; emoji: string }> = []
  connect = vi.fn()
  disconnect = vi.fn()
  private readonly listeners = new Map<keyof ChatSocketEventMap, Set<(payload: unknown) => void>>()

  sendMessage(text: string, authorName: string): void {
    this.sentMessages.push({ text, authorName })
  }

  addReaction(messageId: string, emoji: string): void {
    this.sentReactions.push({ messageId, emoji })
  }

  on<TEventName extends keyof ChatSocketEventMap>(
    eventName: TEventName,
    listener: (payload: ChatSocketEventMap[TEventName]) => void,
  ): () => void {
    const listeners = this.listeners.get(eventName) ?? new Set()
    listeners.add(listener as (payload: unknown) => void)
    this.listeners.set(eventName, listeners)

    return () => {
      listeners.delete(listener as (payload: unknown) => void)
    }
  }

  emit<TEventName extends keyof ChatSocketEventMap>(
    eventName: TEventName,
    payload: ChatSocketEventMap[TEventName],
  ): void {
    this.listeners.get(eventName)?.forEach((listener) => {
      listener(payload)
    })
  }
}

class FailingSendChatClient extends FakeChatClient {
  sendMessage(): void {
    this.emit('error', 'Unable to send the chat event.')
  }
}

function createMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'message-1',
    text: 'Hello',
    author_id: 'user-1',
    author_name: 'Emma Smith',
    created_at: 1_700_000_000,
    reactions: {},
    ...overrides,
  }
}

async function flushQueuedMessages(): Promise<void> {
  await Promise.resolve()
  await nextTick()
}

describe('useChat', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('connects automatically and sends trimmed messages with the configured author', () => {
    const client = new FakeChatClient()
    const chat = useChat({ client, authorName: 'Emil' })

    client.emit('open', undefined)
    const sent = chat.sendMessage('  Sounds promising  ')

    expect(client.connect).toHaveBeenCalledTimes(1)
    expect(sent).toBe(true)
    expect(client.sentMessages).toEqual([{ text: 'Sounds promising', authorName: 'Emil' }])
  })

  it('uses the browser profile name when no author is configured', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const client = new FakeChatClient()
    const chat = useChat({ client })

    client.emit('open', undefined)
    const sent = chat.sendMessage('Hello from this browser')

    expect(sent).toBe(true)
    expect(client.sentMessages).toEqual([
      { text: 'Hello from this browser', authorName: PARTICIPANT_PROFILES[0]!.name },
    ])
  })

  it('blocks invalid sends and disconnected sends', () => {
    const client = new FakeChatClient()
    const chat = useChat({ client, autoConnect: false })

    expect(chat.sendMessage('   ')).toBe(false)
    expect(chat.errorMessage.value).toBe('Write a message before sending.')

    expect(chat.sendMessage('x'.repeat(501))).toBe(false)
    expect(chat.errorMessage.value).toBe('Messages are limited to 500 UTF-8 bytes.')

    expect(chat.sendMessage(String.fromCodePoint(0x1f44f).repeat(126))).toBe(false)
    expect(chat.errorMessage.value).toBe('Messages are limited to 500 UTF-8 bytes.')

    expect(chat.sendMessage('Valid text')).toBe(false)
    expect(chat.errorMessage.value).toBe('Chat is reconnecting. Try again in a moment.')
    expect(client.sentMessages).toEqual([])
  })

  it('keeps synchronous send failures visible to the user', () => {
    const client = new FailingSendChatClient()
    const chat = useChat({ client, autoConnect: false })

    client.emit('open', undefined)
    const sent = chat.sendMessage('This will fail')

    expect(sent).toBe(true)
    expect(chat.errorMessage.value).toBe('Unable to send the chat event.')
  })

  it('upserts incoming messages without duplicating ids', async () => {
    const client = new FakeChatClient()
    const chat = useChat({ client, autoConnect: false })

    client.emit('message', createMessage())
    client.emit('message', createMessage({ text: 'Updated' }))
    await flushQueuedMessages()

    expect(chat.messages.value).toHaveLength(1)
    expect(chat.messages.value[0]?.text).toBe('Updated')
  })

  it('keeps client-side history capped to the backend retention limit', async () => {
    const client = new FakeChatClient()
    const chat = useChat({ client, autoConnect: false })

    for (let index = 0; index < MAX_STORED_MESSAGES + 2; index += 1) {
      client.emit('message', createMessage({ id: `message-${index}`, text: `Message ${index}` }))
    }

    await flushQueuedMessages()

    expect(chat.messages.value).toHaveLength(MAX_STORED_MESSAGES)
    expect(chat.messages.value[0]?.id).toBe('message-2')
    expect(chat.messages.value[chat.messages.value.length - 1]?.id).toBe(`message-${MAX_STORED_MESSAGES + 1}`)
  })

  it('replaces the message from reaction updates', async () => {
    const client = new FakeChatClient()
    const chat = useChat({ client, autoConnect: false })

    client.emit('message', createMessage())
    await flushQueuedMessages()

    client.emit('reactionUpdated', {
      message_id: 'message-1',
      emoji: '😂',
      user_id: 'user-2',
      action: 'added',
      message: createMessage({
        reactions: {
          '😂': ['user-2'],
        },
      }),
    })
    await flushQueuedMessages()

    expect(chat.messages.value[0]?.reactions).toEqual({ '😂': ['user-2'] })
  })

  it('surfaces backend errors and sends reaction toggles only while connected', () => {
    const client = new FakeChatClient()
    const chat = useChat({ client, autoConnect: false })

    chat.toggleReaction('message-1', '👏')
    expect(client.sentReactions).toEqual([])

    client.emit('open', undefined)
    chat.toggleReaction('message-1', '👏')
    client.emit('error', 'Rate limit exceeded. Maximum 60 messages per minute.')

    expect(client.sentReactions).toEqual([{ messageId: 'message-1', emoji: '👏' }])
    expect(chat.errorMessage.value).toBe('Rate limit exceeded. Maximum 60 messages per minute.')

    chat.clearError()
    expect(chat.errorMessage.value).toBe('')
  })
})
