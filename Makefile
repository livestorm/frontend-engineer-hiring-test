.PHONY: start stop logs clean start-stress start-extreme help

start:
	@echo "Starting chat backend..."
	docker-compose up --build

stop:
	@echo "Stopping chat backend..."
	docker-compose down

logs:
	docker-compose logs -f

clean:
	@echo "Cleaning up..."
	docker-compose down -v --remove-orphans
	docker system prune -f

start-stress:
	@echo "Starting chat backend in stress mode (10 msg/sec)..."
	MOCK_MODE=stress docker-compose up --build

start-extreme:
	@echo "Starting chat backend in extreme mode (50 msg/sec)..."
	MOCK_MODE=extreme docker-compose up --build

help:
	@echo "Available commands:"
	@echo "  make start         - Start backend (normal mode)"
	@echo "  make start-stress  - Start backend (stress test - 10 msg/sec)"
	@echo "  make start-extreme - Start backend (extreme test - 50 msg/sec)"
	@echo "  make stop          - Stop backend"
	@echo "  make logs          - View backend logs"
	@echo "  make clean         - Clean up containers and images"