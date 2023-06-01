.PHONY: all
all: help

## make start-backend: Starts a docker image for dynamo and our serverless, for local development
go:
	@docker compose up --build

## make clean: Remove all service containers, orphans and one off containers.
clean:
	@docker-compose down -v --remove-orphans
	@docker-compose rm -v

## help: Show help and exit.
help: Makefile
	@echo
	@echo "  Choose a command:"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo