<script setup lang="ts">
import { computed, ref } from 'vue'
import { COMMON_REACTIONS, MAX_MESSAGE_LENGTH } from '../types/chat'
import { getRemainingMessageLength, isWithinMessageLimit } from '../utils/messageLimits'

const props = defineProps<{
  canSend: boolean
}>()

const emit = defineEmits<{
  sendMessage: [text: string]
}>()

const draft = ref('')
const isEmojiPickerOpen = ref(false)
const trimmedDraft = computed(() => draft.value.trim())
const bytesRemaining = computed(() => getRemainingMessageLength(trimmedDraft.value))
const isTooLong = computed(() => bytesRemaining.value < 0)
const isSendDisabled = computed(() => !props.canSend || trimmedDraft.value.length === 0 || isTooLong.value)

function send(): void {
  if (isSendDisabled.value) {
    return
  }

  emit('sendMessage', trimmedDraft.value)
  draft.value = ''
}

function cancel(): void {
  draft.value = ''
  isEmojiPickerOpen.value = false
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.shiftKey) {
    return
  }

  event.preventDefault()
  send()
}

function appendEmoji(emoji: string): void {
  const nextDraft = `${draft.value}${emoji}`

  if (!isWithinMessageLimit(nextDraft)) {
    isEmojiPickerOpen.value = false
    return
  }

  draft.value = nextDraft
  isEmojiPickerOpen.value = false
}
</script>

<template>
  <form class="chat-composer" aria-label="Message composer" @submit.prevent="send">
    <label class="sr-only" for="chat-message">Share your message</label>
    <textarea
      id="chat-message"
      v-model="draft"
      rows="4"
      :maxlength="MAX_MESSAGE_LENGTH"
      placeholder="Share your message"
      :aria-invalid="isTooLong"
      :aria-describedby="isTooLong ? 'message-length-error' : undefined"
      @keydown="handleKeydown"
    />

    <div class="chat-composer__footer">
      <div class="chat-composer__emoji-picker">
        <button
          class="icon-button"
          type="button"
          aria-label="Open emoji picker"
          :aria-expanded="isEmojiPickerOpen"
          @click="isEmojiPickerOpen = !isEmojiPickerOpen"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 10h.01M15.5 10h.01M8.8 14.2c1.7 1.9 4.7 1.9 6.4 0"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
            />
          </svg>
        </button>

        <div v-if="isEmojiPickerOpen" class="chat-composer__emoji-menu" role="menu">
          <button
            v-for="emoji in COMMON_REACTIONS"
            :key="emoji"
            type="button"
            role="menuitem"
            :aria-label="`Insert ${emoji}`"
            @click="appendEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <p v-if="isTooLong" id="message-length-error" class="chat-composer__error">
        {{ Math.abs(bytesRemaining) }} bytes over the limit.
      </p>

      <div class="chat-composer__actions">
        <button type="button" class="text-button" @click="cancel">Cancel</button>
        <button class="send-button" type="submit" :disabled="isSendDisabled" aria-label="Send message">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m4.5 12.5 14.4-7.2c.5-.2 1 .3.8.8l-5.8 14c-.2.5-.9.5-1.1 0l-2.3-5.1-5.2-1.3c-.6-.2-.7-1-.1-1.2Z"
              fill="none"
              stroke="currentColor"
              stroke-linejoin="round"
              stroke-width="1.8"
            />
            <path d="m10.6 14.9 3.3-3.3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
          </svg>
        </button>
      </div>
    </div>
  </form>
</template>
