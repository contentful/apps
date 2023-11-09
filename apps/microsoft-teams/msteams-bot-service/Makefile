.PHONY: all
all: help


## make start: Starts a docker container for msteams, dynamdob and dynamodbadmin
start:
	@docker compose run --build --rm msteams-bot-service

## make stop: Stops all containers started by `make start`
stop:
	@docker compose down

## make build: Build all the containers required by the project
build:
	@docker compose build

## make initialize-db: Create the dynamodb table in the local test db
initialize-db: build
	@docker-compose run --rm dynamodb-initializer || true

## make test-ci: Run ci tests and exit
test-ci: initialize-db
	@docker-compose run --rm msteams-bot-service npm run test-ci

## make test-watch: Run tests in watch mode
test-watch:
	@docker-compose run --build --rm msteams-bot-service npm run test:watch

## make shell: Start backing services and bring up a shell on the main service
shell:
	@docker-compose run --build --rm msteams-bot-service bash

## make clean: Remove all service containers, orphans and one off containers.
clean:
	@docker-compose down -v --remove-orphans || true
	@docker-compose rm -v
	@rm shared-local-instance.db || true

## help: Show help and exit.
help: Makefile
	@echo
	@echo "  Choose a command:"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo

