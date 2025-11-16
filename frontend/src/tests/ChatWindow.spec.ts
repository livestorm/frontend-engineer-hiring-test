import { test, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ChatWindow from '../components/ChatWindow.vue';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

class MockWebSocket {
    onopen = vi.fn()
    onmessage = vi.fn()
    onclose = vi.fn()
    send = vi.fn()
    close = vi.fn()
}

vi.stubGlobal('WebSocket', MockWebSocket)

test('Component ChatWindow mounts correctly.', async () => {
    expect(ChatWindow).toBeTruthy();
    const wrapper = mount(ChatWindow);
    expect(wrapper.findComponent(Header).exists).toBeTruthy;
    expect(wrapper.findComponent(Footer).exists).toBeTruthy;
    expect(wrapper.text()).toContain('loading chat...')
});

/* 
    OTHER TESTS:
    - Check that onopen, onclose changes status.
    - Check that onmessage 'message' adds message to state.
    - Check that onmessage 'reaction_updated' updates message in state.
    - Unit test orderedMessages to check the order is correct.
    - Unit test sendMessage to check that websocket is sent to.
    - Unit test addReact to check that websocket is sent to.
    - Check that the reactions are counted correctly.
*/
