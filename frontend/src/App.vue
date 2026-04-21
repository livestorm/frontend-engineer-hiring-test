<script setup lang="ts">
import ChatPanel from './components/ChatPanel.vue'
import { useChat } from './composables/useChat'

const { messages, status, errorMessage, canSend, sendMessage, clearError, toggleReaction } = useChat()
</script>

<template>
  <main class="app-shell">
    <ChatPanel
      :messages="messages"
      :status="status"
      :error-message="errorMessage"
      :can-send="canSend"
      @send-message="sendMessage"
      @clear-error="clearError"
      @toggle-reaction="toggleReaction"
    />
  </main>
</template>
