<script setup lang="ts">
import AddReactIcon from '../assets/add_react_icon.svg';
import { ref, type Ref } from 'vue';
import type { messageInterface } from '../types/message';

const { message, addReact } = defineProps<{
    message: messageInterface,
    addReact: (id: number, react: string) => void
}>()

const reactDrawerOpen: Ref<boolean> = ref(false)
</script>

<template>
    <div>
        <div class="messageWrap client" v-if="message.author_name === 'client'">
            <div>
                <div class="senderInfo">
                    <div class="senderName">You</div>
                    <div class="messageTime">{{ message.displayTime }}</div>
                </div>
                <div class="messageBody">{{ message.text }}</div>
            </div>
        </div>
        <div class="messageWrap" v-else>
            <div class="senderProfilePic">
                <span>
                    {{ message.author_name.charAt(0) }}
                </span>
            </div>
            <div>
                <div class="senderInfo">
                    <div class="senderName">{{ message.author_name }}</div>
                    <div class="role highlight" v-if="message.author_name === 'System'">Organizer</div>
                    <div class="messageTime">{{ message.displayTime }}</div>
                </div>
                <div class="messageBody">{{ message.text }}</div>
            </div>
        </div>
        <div class="reacts" v-if="message.author_name !== 'client'">
            <div
                class="highlight"
                v-for="reaction in Object.keys(message.reactions)"
                :key="reaction"
            >
                {{ reaction }}{{ message.reactions[reaction]!.length > 1 ? ' ' + message.reactions[reaction]!.length : '' }}
            </div>
            <Transition>    
                <div v-show="reactDrawerOpen" class="emojisToAdd">
                    <button class="ghost" @click="addReact(message.id, '👍')">👍</button>
                    <button class="ghost" @click="addReact(message.id, '👀')">👀</button>
                    <button class="ghost" @click="addReact(message.id, '🤣')">🤣</button>
                </div>
            </Transition>
            <button class="addReact ghost" @click="reactDrawerOpen = !reactDrawerOpen"><AddReactIcon /></button>
        </div>    
    </div>
</template>

<style scss>
.messageWrap {
    display: grid;
    grid-template-columns: 3rem 1fr;
    gap: 1rem;

    &.client {
        display: block;

        >div {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
    }
}
.senderProfilePic {
    display: flex;
    align-items: center;
    justify-content: space-around;

    span {
        background: var(--colorDarkBlue);
        color: white;
        border-radius: 50%;
        line-height: 1em;
        width: 1em;
        text-align: center;
        padding: 1rem;
    }
}

.senderInfo {
    display: flex;
    align-items: center;
    gap: 0.5rem;


    .senderName {
        color: var(--colorMidGrey);
        font-weight: bold;
    }

    .messageTime {
        color: var(--colorMidGrey);
    }
}

.messageBody {
        text-align: left;
        margin-bottom: 1rem;
    }

.reacts {
    padding: 0 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .highlight {
        font-size: 0.6rem;
        padding: 0.5rem;
    }

    .emojisToAdd {
        background: var(--colorLightGrey);
        display: flex;
        border-radius: 50px;
        overflow: hidden;

        button {
            border-radius: 50px;
            line-height: 1em;
            padding: 0.6rem;

            &:hover {
                background: var(--colorMidGrey);
            }
        }
    }
}

.v-enter-active,
.v-leave-active {
  transition: max-width 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  max-width: 0;
}

.v-enter-to,
.v-leave-from {
    max-width: 150px;
}
</style>