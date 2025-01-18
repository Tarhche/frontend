init:
	@cp -n .env.local.example .env || echo ".env already exists"

ps:
	docker compose ps

up: init
	docker compose up --build -d

down:
	docker compose down --remove-orphans --volumes

sh:
	docker compose exec -it frontend sh
