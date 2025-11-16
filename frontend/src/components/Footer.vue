<script setup lang="ts">
import ReactIcon from '../assets/react_icon.svg';
import SendIcon from '../assets/send_icon.svg';
import { ref, type Ref } from 'vue';

const props = defineProps<{
    sendMessage: (text: string) => void;
}>();

const textField: Ref<string> = ref('');
const reactDrawerOpen: Ref<boolean> = ref(false);

const submitForm = () => {
    props.sendMessage(textField.value);
    textField.value = '';
};
</script>

<template>
    <footer>
        <form v-on:submit.prevent="submitForm">
            <div class="messageBox">
                <textarea name="message" id="message" placeholder="Share your message" v-model="textField"></textarea>
            </div>
            <div class="messageFunctions">
                <Transition>    
                    <div v-show="reactDrawerOpen" class="emojisToAdd">
                        <button type="button" class="ghost" @click="textField += '👍'">👍</button>
                        <button type="button" class="ghost" @click="textField += '👀'">👀</button>
                        <button type="button" class="ghost" @click="textField += '🤣'">🤣</button>
                    </div>
                </Transition>
                
                <button type="button" class="reacts ghost" @click="reactDrawerOpen = !reactDrawerOpen"><ReactIcon /></button>
                <button type="button" class="cancel ghost" @click="textField = ''">Cancel</button>
                <button class="send primary" type="submit"><SendIcon /></button>
            </div>
        </form>
    </footer>
</template>

<style scoped scss>
    footer {
        padding: 1rem;
        margin-top: auto;
        background: var(--colorFooterGrey);
        border-top-left-radius: 1rem;
        border-top-right-radius: 1rem;

        .messageBox {
            textarea {
                background: transparent;
                border: none;
                font-family: inherit;
                width: 100%;
                font-size: 1rem;
                height: 4rem;
                padding: 0.5rem;
                box-sizing: border-box;
            }
        }

        .messageFunctions {
            display: flex;
            justify-content: flex-end;
            padding-top: 1rem;

            .reacts {
                margin-right: auto;
            }
        }

        .emojisToAdd {
            overflow: hidden;
            display: flex;
            border-radius: 50px;
            overflow: hidden;
            align-items: center;

            button {
                border-radius: 50px;
                line-height: 1em;
                padding: 0.6rem;

                &:hover {
                    background: var(--colorMidGrey);
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
    }
</style>