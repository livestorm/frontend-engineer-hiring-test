import { test, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ChatFooter from '../components/ChatFooter.vue';

let wrapper: any;
let sendMessage = vi.fn();;

beforeEach(() => {
    expect(ChatFooter).toBeTruthy();
    sendMessage = vi.fn();
    wrapper = mount(ChatFooter, {
        props: { sendMessage }
    });
})

test('Component ChatFooter mounts correctly.', async () => {
    expect(wrapper.find('textarea')).toBeTruthy;
    expect(wrapper.find('button[type="submit"]')).toBeTruthy;
});

test('Submitting form triggers function.', async () => {
    await wrapper.find('textarea').setValue('test');
    await wrapper.find('form').trigger('submit');
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith('test')
})

test('Cancel button clears textarea.', async () => {
    await wrapper.find('textarea').setValue('test');
    await wrapper.find('button.cancel').trigger('click');
    expect(wrapper.find('textarea').text()).toBe('');
});

/* 
    OTHER TESTS:
    - Emoji drawer opens.
    - Emoji buttons add to textarea.
*/
