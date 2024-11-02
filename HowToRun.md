


export DOCKER_BUILDKIT=1

# Frontend docker build and run 

docker build -f Dockerfile -t clinicali-trial-ui:v1 .
docker run -p 8000:8000 --name clinicali-trial-ui clinicali-trial-ui:v1


# Backend docker build and run 

docker build -f Dockerfile -t langserve_backend:v2 .

docker run --env-file ./.env -p 8080:8080 langserve_backend:v2

# Docker Compose

docker-compose build --no-cache && docker-compose down && docker-compose up