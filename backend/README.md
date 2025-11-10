# Chat Backend

Real-time chat server built with Go and WebSockets.

## Quick Start

```bash
# Development
make run

# With Docker
docker-compose up

# Testing modes
MOCK_MODE=normal make run    # 5 messages, 10s interval
MOCK_MODE=stress make run    # 300 messages, 10/sec
MOCK_MODE=extreme make run   # 1000 messages, 50/sec
```

Server runs on `http://localhost:8080`

## Architecture

```
backend/
├── cmd/
│   └── server/
│       └── main.go           # Application entrypoint
├── pkg/
│   └── chat/
│       ├── message.go        # Message domain model with validation
│       ├── store.go          # Thread-safe in-memory storage
│       ├── websocket.go      # WebSocket hub and client management
│       ├── handlers.go       # HTTP handlers
│       └── mock.go           # Mock data generation for testing
├── go.mod
└── Dockerfile
```

### Health Check

```
GET /health
```

Returns server status and current timestamp.

## WebSocket API Documentation

Full API specification available in `asyncapi.yaml` following AsyncAPI 3.0 standard. [And also served here](https://livestorm.github.io/frontend-engineer-hiring-test/)

### Quick Reference

**Endpoint**: `ws://localhost:8080/ws`

**Client sends**: `send_message`, `add_reaction`

**Server sends**: `message`, `reaction_updated`

All messages are JSON with `type` and `data` fields. See AsyncAPI spec for complete schemas and validation rules.

## Development

```bash
# Run tests
make test

# Build binary
make build

# Run with hot reload
make dev

# Clean artifacts
make clean
```

## Docker

```bash
# Build image
make docker-build

# Run container
make docker-run
```

## Configuration

Environment variables:

- `PORT`: Server port (default: 8080)
- `MOCK_MODE`: Test data generation mode (normal|stress|extreme)

## Dependencies

- `github.com/gorilla/websocket`: WebSocket implementation
- `github.com/google/uuid`: UUID generation
