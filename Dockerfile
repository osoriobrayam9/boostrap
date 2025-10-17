FROM nginx:1.27-alpine

# Archivos estáticos (usa CDN de Bootstrap en index.html)
COPY . /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O - http://localhost/ || exit 1
