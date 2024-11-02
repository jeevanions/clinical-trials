# Running it locall (No Docker)

## Run qdrant locally for local dev

docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant

http://localhost:6333/dashboard#/collections


## Start the backend 

```bash
cd langserve_backend
poetry install

pip install langchain-cli

langchain serve
```

## Start Frontend

```bash
cd clinical-trial-ui
npm install
npm run dev

```

# Docker compose setup

export DOCKER_BUILDKIT=1

# Frontend docker build and run 

docker build -f Dockerfile -t clinicali-trial-ui:v1 .
docker run -p 8000:8000 --name clinicali-trial-ui clinicali-trial-ui:v1


# Backend docker build and run 

docker build -f Dockerfile -t langserve_backend:v2 .

docker run --env-file ./.env -p 8080:8080 langserve_backend:v2

# Docker Compose

docker-compose build --no-cache && docker-compose down && docker-compose up