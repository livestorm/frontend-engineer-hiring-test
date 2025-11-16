<script setup lang="ts">
import ChatWindow from './components/ChatWindow.vue';

</script>

<template>
  <ChatWindow />
</template>

<style scss>
  /* global styles */
  @import './style.css';

  .highlight {
    padding: 0.3rem 0.5rem;
    background: var(--colorLightGrey);
    font-size: 0.8rem;
    border-radius: 1.2rem;
    font-weight: bold;
  }

  button.primary {
    background: var(--colorBlue);
    color: white;
    padding: 0.8rem;
    border-radius: 0.5rem;
  }

  button.ghost {
    background: none;
    border: none;
  }
</style>
