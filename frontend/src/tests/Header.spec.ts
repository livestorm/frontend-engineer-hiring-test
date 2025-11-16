import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChatHeader from '../components/ChatHeader.vue';

test('mount Header', () => {
    expect(ChatHeader).toBeTruthy();
    const wrapper = mount(ChatHeader);
    expect(wrapper.text()).toEqual('Chat');
})