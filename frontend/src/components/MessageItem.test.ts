import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { COMMON_REACTIONS } from '../types/chat'
import MessageItem from './MessageItem.vue'

describe('MessageItem', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders message author, avatar, text, timestamp, and reactions', () => {
    const nowInSeconds = Math.floor(Date.now() / 1000)
    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: 'message-1',
          text: 'Glad to be here!',
          author_id: 'user-1',
          author_name: 'Emma Smith',
          created_at: nowInSeconds,
          reactions: {
            '😂': ['user-2', 'user-3'],
            '👏': ['user-4'],
          },
        },
      },
    })

    expect(wrapper.get('.message-item__avatar').attributes('src')).toContain('/avatars/')
    expect(wrapper.text()).toContain('Emma Smith')
    expect(wrapper.text()).toContain('Just now')
    expect(wrapper.text()).toContain('Glad to be here!')
    expect(wrapper.find('.message-item__quick-reactions').exists()).toBe(true)
    expect(wrapper.text()).toContain('😂')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('👏')
  })

  it('updates Just now to absolute time after one minute', async () => {
    const messageDate = new Date(2026, 3, 21, 16, 5, 56)

    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 21, 16, 6, 40))

    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: 'message-1',
          text: 'Glad to be here!',
          author_id: 'user-1',
          author_name: 'Emma Smith',
          created_at: messageDate.getTime() / 1000,
          reactions: {},
        },
      },
    })

    expect(wrapper.text()).toContain('Just now')

    vi.advanceTimersByTime(17_000)
    await nextTick()

    expect(wrapper.text()).toContain('16:05')
    expect(wrapper.text()).not.toContain('Just now')
  })

  it('renders the organizer badge next to the author name', () => {
    const wrapper = mount(MessageItem, {
      props: {
        isOrganizer: true,
        message: {
          id: 'message-1',
          text: 'Welcome everyone',
          author_id: 'user-1',
          author_name: 'Emma Smith',
          created_at: Math.floor(Date.now() / 1000),
          reactions: {},
        },
      },
    })

    expect(wrapper.get('.message-item__organizer-badge').text()).toBe('Organizer')
  })

  it('emits reaction toggles from the reaction bar', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: 'message-1',
          text: 'Sounds promising',
          author_id: 'user-2',
          author_name: 'John Johnson',
          created_at: Math.floor(Date.now() / 1000),
          reactions: {
            '👏': ['user-1'],
          },
        },
      },
    })

    await wrapper.get('.reaction-chip').trigger('click')

    expect(wrapper.emitted('toggleReaction')).toEqual([['👏']])
  })

  it('hides quick reactions while the reaction picker is open', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: 'message-1',
          text: 'Sounds promising',
          author_id: 'user-2',
          author_name: 'John Johnson',
          created_at: Math.floor(Date.now() / 1000),
          reactions: {
            '👏': ['user-1'],
          },
        },
      },
    })

    await wrapper.get('.reaction-add').trigger('click')
    expect(wrapper.classes()).toContain('message-item--reaction-picker-open')
    expect(wrapper.classes()).toContain('message-item--quick-reactions-suppressed')

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.classes()).not.toContain('message-item--reaction-picker-open')
  })

  it('shows quick reactions for messages without existing reactions', async () => {
    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: 'message-1',
          text: 'Sounds promising',
          author_id: 'user-2',
          author_name: 'John Johnson',
          created_at: Math.floor(Date.now() / 1000),
          reactions: {},
        },
      },
    })

    const quickReactions = wrapper.findAll('.message-item__quick-reaction')

    expect(wrapper.find('.reaction-bar').exists()).toBe(false)
    expect(quickReactions).toHaveLength(5)

    await wrapper.get('.message-item__quick-reaction').trigger('click')

    expect(wrapper.emitted('toggleReaction')).toEqual([[COMMON_REACTIONS[0]]])
    expect(wrapper.classes()).toContain('message-item--quick-reactions-suppressed')

    await wrapper.trigger('pointerleave')

    expect(wrapper.classes()).not.toContain('message-item--quick-reactions-suppressed')
  })

  it('renders inline message emoji with the larger emoji style', () => {
    const applause = String.fromCodePoint(0x1f44f)
    const wrapper = mount(MessageItem, {
      props: {
        message: {
          id: 'message-1',
          text: `Nice ${applause}`,
          author_id: 'user-2',
          author_name: 'John Johnson',
          created_at: Math.floor(Date.now() / 1000),
          reactions: {},
        },
      },
    })

    expect(wrapper.get('.message-item__emoji').text()).toBe(applause)
  })
})
