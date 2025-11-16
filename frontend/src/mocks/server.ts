import { ws } from 'msw';
import { setupServer } from 'msw/node';

export const chat = ws.link(
    'ws://localhost:8080/ws'
);

export const handlers = [];

export const server = setupServer(...handlers)