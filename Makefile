REGISTRY_NAME = museumofartfraud
IMAGE_NAME = issuer-verifier-express

build:
	yarn build
	docker build . -t $(REGISTRY_NAME).azurecr.io/$(IMAGE_NAME)

push:
	az acr login --name $(REGISTRY_NAME)
	docker push $(REGISTRY_NAME).azurecr.io/$(IMAGE_NAME)

deploy:
	make build && make push