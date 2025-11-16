import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Header from '../components/Header.vue';

test('mount Header', () => {
    expect(Header).toBeTruthy();
    const wrapper = mount(Header);
    expect(wrapper.text()).toEqual('Chat');
})