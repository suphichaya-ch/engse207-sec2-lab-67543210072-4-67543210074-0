FROM nginx:1.25-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY activity.html /usr/share/nginx/html/activity.html
COPY config.js /usr/share/nginx/html/config.js
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]