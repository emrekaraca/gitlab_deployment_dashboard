FROM node:lts-alpine as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build:style
RUN npm run build

FROM nginx:stable as server
COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/nginx/nginx.conf /etc/nginx/
COPY --from=build /app/nginx/default.conf.template /etc/nginx/conf.d/
COPY --from=build /app/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

FROM nginx:stable as dev-server
COPY --from=build /app/nginx/nginx.conf /etc/nginx/
COPY --from=build /app/nginx/default.conf.dev.template /etc/nginx/conf.d/default.conf.template
COPY --from=build /app/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
