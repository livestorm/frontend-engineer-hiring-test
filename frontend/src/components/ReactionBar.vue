<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { COMMON_REACTIONS } from '../types/chat'
import type { ChatMessage } from '../types/chat'
import { getReactionSummaries } from '../utils/messageFormatting'

const props = defineProps<{
  messageId: string
  reactions: ChatMessage['reactions']
}>()

const emit = defineEmits<{
  toggleReaction: [emoji: string]
  pickerOpenChange: [isOpen: boolean]
}>()

const reactionBarElement = ref<HTMLElement | null>(null)
const isPickerOpen = ref(false)
const reactionSummaries = computed(() => getReactionSummaries(props.reactions))

function toggleReaction(emoji: string): void {
  emit('toggleReaction', emoji)
  isPickerOpen.value = false
}

function closePicker(): void {
  isPickerOpen.value = false
}

function handleDocumentClick(event: MouseEvent): void {
  if (!isPickerOpen.value || !(event.target instanceof Node)) {
    return
  }

  if (!reactionBarElement.value?.contains(event.target)) {
    closePicker()
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closePicker()
  }
}

function removeDocumentListeners(): void {
  document.removeEventListener('click', handleDocumentClick, true)
  document.removeEventListener('keydown', handleDocumentKeydown)
}

watch(isPickerOpen, (isOpen) => {
  emit('pickerOpenChange', isOpen)

  if (isOpen) {
    document.addEventListener('click', handleDocumentClick, true)
    document.addEventListener('keydown', handleDocumentKeydown)
    return
  }

  removeDocumentListeners()
})

onBeforeUnmount(() => {
  removeDocumentListeners()
  emit('pickerOpenChange', false)
})
</script>

<template>
  <div
    ref="reactionBarElement"
    class="reaction-bar"
    :aria-label="`Reactions for message ${messageId}`"
  >
    <button
      v-for="reaction in reactionSummaries"
      :key="reaction.emoji"
      class="reaction-chip"
      type="button"
      :aria-label="`Toggle ${reaction.emoji} reaction`"
      @click="toggleReaction(reaction.emoji)"
    >
      <span aria-hidden="true">{{ reaction.emoji }}</span>
      <span>{{ reaction.count }}</span>
    </button>

    <div class="reaction-picker">
      <button
        class="reaction-add"
        type="button"
        aria-label="Add reaction"
        :aria-expanded="isPickerOpen"
        @click="isPickerOpen = !isPickerOpen"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M11 4.5a7.5 7.5 0 1 0 7.25 9.42M8.6 10.5h.01M14.1 10.5h.01M8.8 14.4c1.7 1.7 4.3 1.7 6 0M18 4v6M15 7h6"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.8"
          />
        </svg>
      </button>

      <div v-if="isPickerOpen" class="reaction-picker__menu" role="menu">
        <button
          v-for="emoji in COMMON_REACTIONS"
          :key="emoji"
          type="button"
          role="menuitem"
          :aria-label="`React with ${emoji}`"
          @click="toggleReaction(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>
