import { describe, expect, it, vi } from 'vitest'
import { ChatSocket, parseServerMessage } from './chatSocket'

class FakeWebSocket extends EventTarget {
  readonly url: string
  readyState: number = WebSocket.CONNECTING
  readonly sentPayloads: string[] = []
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED
  })

  constructor(url: string) {
    super()
    this.url = url
  }

  send(payload: string): void {
    this.sentPayloads.push(payload)
  }

  open(): void {
    this.readyState = WebSocket.OPEN
    this.dispatchEvent(new Event('open'))
  }

  receive(payload: unknown): void {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(payload) }))
  }
}

class ThrowingFakeWebSocket extends FakeWebSocket {
  send(): void {
    throw new Error('send failed')
  }
}

describe('ChatSocket', () => {
  it('sends backend-compatible message and reaction payloads', () => {
    const socket = new FakeWebSocket('ws://example.test/ws')
    const chatSocket = new ChatSocket('ws://example.test/ws', () => socket as unknown as WebSocket)

    chatSocket.connect()
    socket.open()
    chatSocket.sendMessage('Hello team', 'Emil')
    chatSocket.addReaction('message-1', '👏')

    expect(socket.sentPayloads.map((payload) => JSON.parse(payload))).toEqual([
      {
        type: 'send_message',
        data: {
          text: 'Hello team',
          author_name: 'Emil',
        },
      },
      {
        type: 'add_reaction',
        data: {
          message_id: 'message-1',
          emoji: '👏',
        },
      },
    ])
  })

  it('routes incoming server events to listeners', () => {
    const socket = new FakeWebSocket('ws://example.test/ws')
    const chatSocket = new ChatSocket('ws://example.test/ws', () => socket as unknown as WebSocket)
    const onMessage = vi.fn()
    const onReactionUpdated = vi.fn()
    const onError = vi.fn()

    chatSocket.on('message', onMessage)
    chatSocket.on('reactionUpdated', onReactionUpdated)
    chatSocket.on('error', onError)
    chatSocket.connect()

    const message = {
      id: 'message-1',
      text: 'Welcome',
      author_id: 'user-1',
      author_name: 'Emma Smith',
      created_at: 1_700_000_000,
      reactions: {},
    }

    socket.receive({ type: 'message', data: message })
    socket.receive({
      type: 'reaction_updated',
      data: {
        message_id: 'message-1',
        emoji: '😂',
        user_id: 'user-2',
        action: 'added',
        message: {
          ...message,
          reactions: {
            '😂': ['user-2'],
          },
        },
      },
    })
    socket.receive({ type: 'error', data: { error: 'message text cannot be empty' } })

    expect(onMessage).toHaveBeenCalledWith(message)
    expect(onReactionUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        emoji: '😂',
        action: 'added',
      }),
    )
    expect(onError).toHaveBeenCalledWith('message text cannot be empty')
  })

  it('closes the active socket and removes listeners on disconnect', () => {
    const socket = new FakeWebSocket('ws://example.test/ws')
    const chatSocket = new ChatSocket('ws://example.test/ws', () => socket as unknown as WebSocket)
    const onMessage = vi.fn()

    chatSocket.on('message', onMessage)
    chatSocket.connect()
    socket.open()
    chatSocket.disconnect()
    socket.receive({
      type: 'message',
      data: {
        id: 'message-1',
        text: 'After close',
        author_id: 'user-1',
        author_name: 'Emma Smith',
        created_at: 1_700_000_000,
        reactions: {},
      },
    })

    expect(socket.close).toHaveBeenCalledTimes(1)
    expect(onMessage).not.toHaveBeenCalled()
  })

  it('ignores stale events from a previous socket instance', () => {
    const firstSocket = new FakeWebSocket('ws://example.test/ws')
    const secondSocket = new FakeWebSocket('ws://example.test/ws')
    const createWebSocket = vi.fn().mockReturnValueOnce(firstSocket).mockReturnValueOnce(secondSocket)
    const chatSocket = new ChatSocket('ws://example.test/ws', createWebSocket)
    const onMessage = vi.fn()
    const onOpen = vi.fn()

    chatSocket.on('message', onMessage)
    chatSocket.on('open', onOpen)
    chatSocket.connect()
    chatSocket.connect()

    firstSocket.open()
    firstSocket.receive({
      type: 'message',
      data: {
        id: 'stale-message',
        text: 'Ignore me',
        author_id: 'user-1',
        author_name: 'Stale User',
        created_at: 1_700_000_000,
        reactions: {},
      },
    })
    secondSocket.open()

    expect(onMessage).not.toHaveBeenCalled()
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('surfaces connection startup and send failures as errors', () => {
    const startupFailure = new ChatSocket('invalid-url', () => {
      throw new Error('invalid url')
    })
    const sendFailureSocket = new ThrowingFakeWebSocket('ws://example.test/ws')
    const sendFailure = new ChatSocket('ws://example.test/ws', () => sendFailureSocket as unknown as WebSocket)
    const onStartupError = vi.fn()
    const onStartupClose = vi.fn()
    const onSendError = vi.fn()

    startupFailure.on('error', onStartupError)
    startupFailure.on('close', onStartupClose)
    startupFailure.connect()

    sendFailure.on('error', onSendError)
    sendFailure.connect()
    sendFailureSocket.open()
    sendFailure.sendMessage('Hello', 'Emil')

    expect(onStartupError).toHaveBeenCalledWith('Unable to start the chat connection.')
    expect(onStartupClose).toHaveBeenCalledTimes(1)
    expect(onSendError).toHaveBeenCalledWith('Unable to send the chat event.')
  })
})

describe('parseServerMessage', () => {
  it('rejects invalid server payloads', () => {
    expect(parseServerMessage('not json')).toBeNull()
    expect(parseServerMessage(JSON.stringify({ type: 'message', data: { id: 'missing-fields' } }))).toBeNull()
  })
})
