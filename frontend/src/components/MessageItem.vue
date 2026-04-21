<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { COMMON_REACTIONS } from '../types/chat'
import type { ChatMessage } from '../types/chat'
import {
  formatMessageTime,
  getMessageTextSegments,
  getReactionSummaries,
} from '../utils/messageFormatting'
import { getAvatarUrlForAuthor } from '../utils/participantProfile'
import ReactionBar from './ReactionBar.vue'

const props = defineProps<{
  message: ChatMessage
  isOrganizer?: boolean
}>()

const emit = defineEmits<{
  toggleReaction: [emoji: string]
}>()

const currentTime = ref(new Date())
const sentAt = computed(() => formatMessageTime(props.message.created_at, currentTime.value))
const textSegments = computed(() => getMessageTextSegments(props.message.text))
const reactionSummaries = computed(() => getReactionSummaries(props.message.reactions))
const avatarUrl = computed(() => getAvatarUrlForAuthor(props.message.author_name))
const hasReactions = computed(() => reactionSummaries.value.length > 0)
const isReactionPickerOpen = ref(false)
const areQuickReactionsSuppressed = ref(false)
const quickReactions = COMMON_REACTIONS.slice(0, 5)
let timestampUpdateTimer: ReturnType<typeof window.setTimeout> | null = null

function clearTimestampUpdateTimer(): void {
  if (timestampUpdateTimer) {
    window.clearTimeout(timestampUpdateTimer)
    timestampUpdateTimer = null
  }
}

function refreshTimestamp(): void {
  currentTime.value = new Date()
  scheduleTimestampUpdate()
}

function scheduleTimestampUpdate(): void {
  clearTimestampUpdateTimer()

  const millisecondsUntilAbsoluteTime =
    props.message.created_at * 1000 + 60_000 - currentTime.value.getTime()

  if (millisecondsUntilAbsoluteTime > 0) {
    timestampUpdateTimer = window.setTimeout(refreshTimestamp, millisecondsUntilAbsoluteTime + 100)
  }
}

function toggleQuickReaction(emoji: string, event: MouseEvent): void {
  emit('toggleReaction', emoji)
  areQuickReactionsSuppressed.value = true

  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.blur()
  }
}

function handleReactionPickerOpenChange(isOpen: boolean): void {
  isReactionPickerOpen.value = isOpen

  if (isOpen) {
    areQuickReactionsSuppressed.value = true
  }
}

watch(
  () => props.message.created_at,
  () => {
    currentTime.value = new Date()
    scheduleTimestampUpdate()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimestampUpdateTimer()
})
</script>

<template>
  <article
    class="message-item"
    :class="{
      'message-item--reaction-picker-open': isReactionPickerOpen,
      'message-item--quick-reactions-suppressed': areQuickReactionsSuppressed,
    }"
    @pointerleave="areQuickReactionsSuppressed = false"
  >
    <img
      class="message-item__avatar"
      :src="avatarUrl"
      alt=""
      width="36"
      height="36"
      aria-hidden="true"
      decoding="async"
      loading="lazy"
    />

    <div class="message-item__content">
      <div
        class="message-item__quick-reactions"
        role="group"
        :aria-label="`Quick reactions for message ${message.id}`"
      >
        <button
          v-for="emoji in quickReactions"
          :key="emoji"
          class="message-item__quick-reaction"
          type="button"
          :aria-label="`React with ${emoji}`"
          @click="toggleQuickReaction(emoji, $event)"
        >
          {{ emoji }}
        </button>
      </div>

      <header class="message-item__meta">
        <strong>{{ message.author_name }}</strong>
        <span v-if="isOrganizer" class="message-item__organizer-badge">Organizer</span>
        <time :datetime="new Date(message.created_at * 1000).toISOString()">{{ sentAt }}</time>
      </header>

      <p class="message-item__text">
        <span
          v-for="(segment, index) in textSegments"
          :key="`${index}-${segment.text}`"
          :class="{ 'message-item__emoji': segment.isEmoji }"
        >
          {{ segment.text }}
        </span>
      </p>

      <ReactionBar
        v-if="hasReactions"
        :message-id="message.id"
        :reactions="message.reactions"
        @toggle-reaction="(emoji) => emit('toggleReaction', emoji)"
        @picker-open-change="handleReactionPickerOpenChange"
      />
    </div>
  </article>
</template>
