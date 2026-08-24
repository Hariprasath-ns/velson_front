FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy template to a neutral location - NOT /etc/nginx/templates/
# (nginx docker entrypoint auto-runs envsubst on /etc/nginx/templates/ which corrupts nginx vars like $uri, $host)
COPY nginx.conf /etc/nginx/nginx_template.conf

ENV BACKEND_URL=http://velson-backend:3000

EXPOSE 80

# Manually substitute only BACKEND_URL, leaving nginx variables ($uri, $host, etc.) untouched
CMD ["/bin/sh", "-c", "envsubst '$BACKEND_URL' < /etc/nginx/nginx_template.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
