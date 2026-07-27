# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# VITE_API_URL: set to your backend public URL in Railway (e.g. https://vire-backend.up.railway.app)
# If empty, the frontend will use relative /api paths (works when frontend & backend are same origin)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production Stage
FROM nginx:alpine
# Copiar configuración custom de nginx para el SPA (fallback a index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
