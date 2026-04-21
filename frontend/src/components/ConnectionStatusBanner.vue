<script setup lang="ts">
import type { ConnectionStatus } from '../types/chat'

const props = defineProps<{
  status: ConnectionStatus
  errorMessage: string
}>()

const emit = defineEmits<{
  clearError: []
}>()
</script>

<template>
  <div class="status-region" aria-live="polite">
    <p v-if="props.status === 'connecting'" class="status-pill">Connecting to chat...</p>
    <p v-else-if="props.status === 'reconnecting'" class="status-pill status-pill--warning">
      Reconnecting to chat...
    </p>
    <p v-else-if="props.status === 'disconnected'" class="status-pill status-pill--warning">
      Chat is offline.
    </p>

    <div v-if="props.errorMessage" class="status-error" role="alert">
      <span>{{ props.errorMessage }}</span>
      <button type="button" aria-label="Dismiss error" @click="emit('clearError')">Dismiss</button>
    </div>
  </div>
</template>
