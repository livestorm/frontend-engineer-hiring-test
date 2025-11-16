import { test, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Message from '../components/Message.vue';

test('Component Message mounts correctly.', async () => {
    expect(Message).toBeTruthy();
    const mockAddReact = vi.fn();
    const mockProps = {
            message: {
                id: 1234,
                author_name: 'Author',
                created_at: 5678,
                displayTime: '15:44',
                text: 'This is the text',
                reactions: {
                    '👀': ['one', 'two']
                }
            },
            addReact: mockAddReact
        }
    const wrapper = mount(Message, {
        props: mockProps
    });
    expect(wrapper.get('.senderName').text()).toEqual(mockProps.message.author_name);
    expect(wrapper.get('.messageTime').text()).toEqual(mockProps.message.displayTime);
    expect(wrapper.get('.messageBody').text()).toEqual(mockProps.message.text);
})

test('Function addReact fires correctly.', async () => {
    expect(Message).toBeTruthy();
    const mockAddReact = vi.fn();
    const mockProps = {
            message: {
                id: 1234,
                author_name: 'Author',
                created_at: 5678,
                displayTime: '15:44',
                text: 'This is the text',
                reactions: {
                    '👀': ['one', 'two']
                }
            },
            addReact: mockAddReact
        }
    const wrapper = mount(Message, {
        props: mockProps
    });
    wrapper.get('.addReact').trigger('click');
    expect(wrapper.get('.emojisToAdd')).toBeTruthy();
    expect(wrapper.get('.emojisToAdd').findAll('button').length).toBe(3);
    wrapper.get('.emojisToAdd button:first-of-type').trigger('click');
    expect(mockAddReact).toHaveBeenCalled();
})

/* 
    OTHER TESTS:
    - Check that the first initial is taken for profile pic.
    - Check that the reactions are counted correctly.
*/