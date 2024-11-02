FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Install serve globally
RUN npm i -g serve

# Enable caching for npm
COPY .npmrc* ./

# Add Docker layer caching
COPY tsconfig*.json* ./
COPY vite.config.* ./

# Copy source code
COPY src ./src
COPY public ./public
COPY index.html ./

# Build the app
RUN npm run build

EXPOSE 8000

CMD ["serve", "-s", "dist", "-l", "8000"]