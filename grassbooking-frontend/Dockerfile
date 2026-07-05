# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# ARG allows overriding the API URL at build time:
# docker build --build-arg VITE_API_URL=https://tu-dominio.com/api ...
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Production stage (nginx) ----
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
# React Router: todas las rutas apuntan a index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
