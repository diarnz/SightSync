FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS runtime
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

ENV PORT=8080
ENV VITE_API_BASE_URL=/api
EXPOSE 8080
