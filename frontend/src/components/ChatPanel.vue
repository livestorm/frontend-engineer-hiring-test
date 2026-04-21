<script setup lang="ts">
import type { ChatMessage, ConnectionStatus } from '../types/chat'
import ChatComposer from './ChatComposer.vue'
import ConnectionStatusBanner from './ConnectionStatusBanner.vue'
import MessageList from './MessageList.vue'

defineProps<{
  messages: ChatMessage[]
  status: ConnectionStatus
  errorMessage: string
  canSend: boolean
}>()

const emit = defineEmits<{
  sendMessage: [text: string]
  clearError: []
  toggleReaction: [messageId: string, emoji: string]
}>()
</script>

<template>
  <section class="chat-panel" aria-labelledby="chat-title">
    <header class="chat-panel__header">
      <h1 id="chat-title">Chat</h1>
      <div class="chat-panel__tab" aria-hidden="true"></div>
    </header>

    <ConnectionStatusBanner
      :status="status"
      :error-message="errorMessage"
      @clear-error="emit('clearError')"
    />

    <MessageList
      class="chat-panel__messages"
      :messages="messages"
      @toggle-reaction="(messageId, emoji) => emit('toggleReaction', messageId, emoji)"
    />

    <ChatComposer
      class="chat-panel__composer"
      :can-send="canSend"
      @send-message="(text) => emit('sendMessage', text)"
    />
  </section>
</template>
