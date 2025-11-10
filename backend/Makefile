.PHONY: test build run dev docker-build docker-run docker-stress docker-extreme

# Development
test:
	go test -v ./...

build:
	go build -o chat-backend ./cmd/server

run:
	go run ./cmd/server

dev:
	MOCK_MODE=normal go run ./cmd/server

# Docker
docker-build:
	docker-compose build

docker-run:
	docker-compose up

docker-stress:
	docker-compose -f docker-compose.stress.yml up

docker-extreme:
	docker-compose -f docker-compose.extreme.yml up

# Clean
clean:
	rm -f chat-backend
