#!/usr/bin/env sh
set -eu

envsubst '${GITLAB_BASE_URL} ${GITLAB_API_TOKEN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"