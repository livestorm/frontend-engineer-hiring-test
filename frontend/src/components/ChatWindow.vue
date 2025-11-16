<script setup lang="ts">
import { ref, onMounted, computed, type Ref, type ComputedRef } from 'vue';
import ChatHeader from './ChatHeader.vue';
import MessageItem from './MessageItem.vue';
import ChatFooter from './ChatFooter.vue';
import { type messageInterface } from '../types/message';

const status: Ref<string> = ref('loading chat...');
const ws: Ref<WebSocket | null> = ref(null);
const messages: Ref<messageInterface[]> = ref([])

onMounted(() => {
    ws.value = new WebSocket('ws://localhost:8080/ws');
    
    ws.value.onopen = () => {
        status.value = '';
    };

    ws.value.onmessage = ({ data }) => {
        const { type, data: messageData } = JSON.parse(data)
        switch (type) {
            case 'message': {
                const displayTime = new Date(messageData.created_at * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                messages.value.push({
                    displayTime,
                    ...messageData
                })
                break;
            }
            case 'reaction_updated': {
                const { message_id: updatedId, emoji, user_id } = messageData;
                const thisMessage = messages.value.find(message => message?.id === updatedId)
                if (thisMessage) thisMessage.reactions[emoji] = [user_id, ...(thisMessage.reactions[emoji] || []), ]
                break;
            }
            default:
                break;
        }
    }

    ws.value.onclose = () => {
        status.value = 'Lost connection to chat server';
    }
});

const orderedMessages: ComputedRef<messageInterface[]> = computed(() => {
    return [...messages.value].sort((a, b) => b.created_at - a.created_at)
})

const sendMessage = (text: string) => {
    ws.value?.send(JSON.stringify({ type: 'send_message', data: {
        text,
        author_name: 'client'
    }}));
};

const addReact = (message_id: number, emoji: string) => {
    ws.value?.send(JSON.stringify({ type: 'add_reaction', data: {
        message_id,
        emoji
    }}));
};

</script>

<template>
    <div class="chatWindow">
        <ChatHeader />
        <main>
            <div v-if="!!status">{{ status }}</div>
            <MessageItem
                v-for="message in orderedMessages"
                :key="message.id"
                :message="message"
                :addReact="addReact"
            ></MessageItem>
        </main>
        <ChatFooter :sendMessage="sendMessage" />
    </div>
</template>

<style scss>
.chatWindow {
    width: 90vw;
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    height: 90vh;
    background: white;
    border: 1px var(--colorLightGrey) solid;
    border-bottom: none;
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-width: 640px;
}

main {
    padding: 0 1rem;
    display: flex;
    flex-direction: column-reverse;
    overflow-y: scroll;
    overflow-x: hidden;

    >div {
        padding-bottom: 1rem;
    }
}
</style>