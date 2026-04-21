<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ChatMessage } from '../types/chat'
import MessageItem from './MessageItem.vue'

const props = defineProps<{
  messages: ChatMessage[]
}>()

const emit = defineEmits<{
  toggleReaction: [messageId: string, emoji: string]
}>()

const listElement = ref<HTMLElement | null>(null)
let shouldStickToBottom = true

function isNearBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 96
}

function handleScroll(): void {
  if (!listElement.value) {
    return
  }

  shouldStickToBottom = isNearBottom(listElement.value)
}

watch(
  () => props.messages.length,
  async () => {
    await nextTick()

    if (shouldStickToBottom && listElement.value) {
      listElement.value.scrollTop = listElement.value.scrollHeight
    }
  },
)
</script>

<template>
  <div ref="listElement" class="message-list" role="log" aria-live="polite" @scroll.passive="handleScroll">
    <p v-if="messages.length === 0" class="message-list__empty">No messages yet.</p>

    <MessageItem
      v-for="message in messages"
      :key="message.id"
      :message="message"
      @toggle-reaction="(emoji) => emit('toggleReaction', message.id, emoji)"
    />
  </div>
</template>
