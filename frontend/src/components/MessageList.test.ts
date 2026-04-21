import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '../types/chat'
import MessageList from './MessageList.vue'

function createMessage(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'message-1',
    text: 'Hello',
    author_id: 'user-1',
    author_name: 'Emma Smith',
    created_at: Math.floor(Date.now() / 1000),
    reactions: {},
    ...overrides,
  }
}

describe('MessageList', () => {
  it('marks the first non-system message author as organizer', () => {
    const wrapper = mount(MessageList, {
      props: {
        messages: [
          createMessage({
            id: 'system-message',
            text: 'Welcome to the chat!',
            author_id: 'system',
            author_name: 'System',
          }),
          createMessage({
            id: 'organizer-message',
            author_id: 'user-1',
            author_name: 'Emma Smith',
          }),
          createMessage({
            id: 'guest-message',
            author_id: 'user-2',
            author_name: 'John Johnson',
          }),
        ],
      },
    })

    const messages = wrapper.findAll('.message-item')

    expect(messages[0]?.find('.message-item__organizer-badge').exists()).toBe(false)
    expect(messages[1]?.find('.message-item__organizer-badge').text()).toBe('Organizer')
    expect(messages[2]?.find('.message-item__organizer-badge').exists()).toBe(false)
  })
})
