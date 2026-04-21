import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ChatComposer from './ChatComposer.vue'

describe('ChatComposer', () => {
  it('sends trimmed text and clears the draft on submit', async () => {
    const wrapper = mount(ChatComposer, {
      props: {
        canSend: true,
      },
    })

    const textarea = wrapper.get('textarea')
    await textarea.setValue('  Hello from chat  ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('sendMessage')).toEqual([['Hello from chat']])
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('sends on Enter and keeps Shift+Enter for multiline drafts', async () => {
    const wrapper = mount(ChatComposer, {
      props: {
        canSend: true,
      },
    })

    const textarea = wrapper.get('textarea')
    await textarea.setValue('First line')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(wrapper.emitted('sendMessage')).toBeUndefined()

    await textarea.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('sendMessage')).toEqual([['First line']])
  })

  it('clears the draft on cancel', async () => {
    const wrapper = mount(ChatComposer, {
      props: {
        canSend: true,
      },
    })

    const textarea = wrapper.get('textarea')
    await textarea.setValue('Discard me')
    await wrapper.get('.text-button').trigger('click')

    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('inserts emoji from the composer picker', async () => {
    const wrapper = mount(ChatComposer, {
      props: {
        canSend: true,
      },
    })

    await wrapper.get('.icon-button').trigger('click')
    const applauseButton = wrapper.findAll('[role="menuitem"]').find((button) => button.text() === '👏')

    expect(applauseButton).toBeDefined()
    await applauseButton?.trigger('click')

    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('👏')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('blocks empty, too-long, and disconnected sends', async () => {
    const wrapper = mount(ChatComposer, {
      props: {
        canSend: true,
      },
    })

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('sendMessage')).toBeUndefined()

    await wrapper.get('textarea').setValue('x'.repeat(501))
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('1 bytes over the limit.')
    expect(wrapper.emitted('sendMessage')).toBeUndefined()

    await wrapper.get('textarea').setValue(String.fromCodePoint(0x1f44f).repeat(126))
    expect(wrapper.text()).toContain('4 bytes over the limit.')

    await wrapper.setProps({ canSend: false })
    expect(wrapper.get('textarea').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('.send-button').attributes('disabled')).toBeDefined()
  })

  it('does not insert an emoji that would exceed the backend size limit', async () => {
    const wrapper = mount(ChatComposer, {
      props: {
        canSend: true,
      },
    })

    const textarea = wrapper.get('textarea')
    await textarea.setValue('x'.repeat(498))
    await wrapper.get('.icon-button').trigger('click')
    await wrapper.get('[role="menuitem"]').trigger('click')

    expect((textarea.element as HTMLTextAreaElement).value).toBe('x'.repeat(498))
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})
