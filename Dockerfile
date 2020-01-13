FROM node:lts-alpine as build
RUN apk add --update wget zip unzip
RUN wget https://github.com/emrekaraca/gitlab_deployment_dashboard/archive/master.zip -O /tmp/gitlab_deployment_dashboard.zip
RUN unzip /tmp/gitlab_deployment_dashboard.zip -d /tmp/
RUN rm /tmp/gitlab_deployment_dashboard.zip
RUN mkdir -p app
RUN mv /tmp/gitlab_deployment_dashboard-master/* /app/
RUN rm -R /tmp/gitlab_deployment_dashboard-master/
WORKDIR /app
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