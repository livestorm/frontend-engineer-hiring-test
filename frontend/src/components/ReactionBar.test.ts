import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ReactionBar from './ReactionBar.vue'

const laughing = String.fromCodePoint(0x1f602)
const applause = String.fromCodePoint(0x1f44f)

describe('ReactionBar', () => {
  it('renders reaction counts and emits chip toggles', async () => {
    const wrapper = mount(ReactionBar, {
      props: {
        messageId: 'message-1',
        reactions: {
          [laughing]: ['user-1', 'user-2'],
        },
      },
    })

    expect(wrapper.text()).toContain(laughing)
    expect(wrapper.get('.reaction-chip__count').text()).toBe('2')
    await wrapper.get('.reaction-chip').trigger('click')

    expect(wrapper.emitted('toggleReaction')).toEqual([[laughing]])
  })

  it('hides the visible count for single reactions', () => {
    const wrapper = mount(ReactionBar, {
      props: {
        messageId: 'message-1',
        reactions: {
          [applause]: ['user-1'],
        },
      },
    })

    expect(wrapper.get('.reaction-chip__emoji').text()).toBe(applause)
    expect(wrapper.find('.reaction-chip__count').exists()).toBe(false)
    expect(wrapper.get('.reaction-chip').attributes('aria-label')).toContain('1 reaction')
  })

  it('opens the emoji picker and emits the selected reaction', async () => {
    const wrapper = mount(ReactionBar, {
      props: {
        messageId: 'message-1',
        reactions: {},
      },
    })

    await wrapper.get('.reaction-add').trigger('click')
    const applauseButton = wrapper.findAll('[role="menuitem"]').find((button) => button.text() === applause)

    expect(applauseButton).toBeDefined()
    await applauseButton?.trigger('click')

    expect(wrapper.emitted('toggleReaction')).toEqual([[applause]])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes the emoji picker when clicking outside', async () => {
    const wrapper = mount(ReactionBar, {
      props: {
        messageId: 'message-1',
        reactions: {},
      },
    })

    await wrapper.get('.reaction-add').trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})
