import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ReactionBar from './ReactionBar.vue'

describe('ReactionBar', () => {
  it('renders reaction counts and emits chip toggles', async () => {
    const wrapper = mount(ReactionBar, {
      props: {
        messageId: 'message-1',
        reactions: {
          '😂': ['user-1', 'user-2'],
        },
      },
    })

    expect(wrapper.text()).toContain('😂')
    expect(wrapper.text()).toContain('2')
    await wrapper.get('.reaction-chip').trigger('click')

    expect(wrapper.emitted('toggleReaction')).toEqual([['😂']])
  })

  it('opens the emoji picker and emits the selected reaction', async () => {
    const wrapper = mount(ReactionBar, {
      props: {
        messageId: 'message-1',
        reactions: {},
      },
    })

    await wrapper.get('.reaction-add').trigger('click')
    const applauseButton = wrapper.findAll('[role="menuitem"]').find((button) => button.text() === '👏')

    expect(applauseButton).toBeDefined()
    await applauseButton?.trigger('click')

    expect(wrapper.emitted('toggleReaction')).toEqual([['👏']])
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
