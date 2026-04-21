# Livestorm Chat Frontend

Vue 3 + TypeScript implementation of the Livestorm realtime chat component.

## Demo

<video src="./public/screenshot.mp4" controls width="360"></video>

[Open demo video](./public/screenshot.mp4)

## Setup

Install dependencies from the frontend folder:

```bash
pnpm install
```

Start the backend from the repository root:

```bash
make start
```

The backend WebSocket route used by the app is `ws://localhost:8080/ws`. This matches the backend source and backend README. It can be overridden with:

```bash
VITE_CHAT_WS_URL=ws://localhost:8080/ws pnpm dev
```

Run the frontend:

```bash
pnpm dev
```

## Scripts

```bash
pnpm dev       # Start Vite
pnpm test      # Run Vitest in watch mode
pnpm test:run  # Run the test suite once
pnpm build     # Typecheck and build production assets
```

## Architecture

- `services/chatSocket.ts` owns the backend WebSocket protocol and runtime payload guards.
- `composables/useChat.ts` owns chat state, connection status, reconnect behavior, send/reaction actions, and batched inbound updates.
- `components/` contains presentational chat UI: panel, status banner, message list, message item, reactions, and composer.
- `types/chat.ts` mirrors the backend AsyncAPI contract used by the frontend.

Messages are stored as a `Map` plus ordered id list and capped to the backend's latest 1000 messages. Incoming `message` events upsert by id, and `reaction_updated` replaces the full message supplied by the backend. This keeps rendering stable under the backend stress modes without adding a global store or virtual scroller for the server's retention limit.

## Product and Protocol Decisions

- The UI follows the supplied screenshot: centered light chat panel, photo avatars, muted author metadata, reaction chips, emoji add button, and bottom composer.
- Each browser gets a persisted random display profile from `utils/participantProfile.ts`; the chosen name is sent in `send_message`, and avatars are resolved client-side from the display name.
- Sending is not optimistic. The backend does not accept a client-generated message id, so the UI waits for the server broadcast to avoid duplicate or unreconciled messages.
- Reaction highlighting for the current user is intentionally omitted because the backend does not expose the active `user_id` in a handshake.
- Existing reaction chips stay visible; empty-message add-reaction controls are muted until hover/focus on pointer devices to avoid noisy repeated icons.
- The organizer badge is inferred from the first non-system message author because the message schema has no role field.
- The composer trims whitespace, blocks empty messages, enforces the backend's 500-byte validation rule, sends on Enter, and preserves Shift+Enter for multiline drafts.

## Testing

The test suite covers:

- Exact WebSocket payloads for `send_message` and `add_reaction`.
- Incoming `message`, `reaction_updated`, and `error` handling.
- Socket cleanup behavior.
- Composable validation, batching, message upserts, reaction replacement, and error state.
- Component behavior for message rendering, composer actions, disabled states, and reaction picker interactions.

Manual performance checks can use the backend mock modes:

```bash
make start-stress   # 10 messages/sec
make start-extreme  # 50 messages/sec
```
