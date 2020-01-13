# Gitlab Deployment Dashboard

This app visualizes the status of all environments for all projects with active environments.
To be able to run it, you need to specify the `GITLAB_BASE_URL` (e.g. https://gitlab.example.com) and a `GITLAB_API_TOKEN`. The dashboard wil be able to display all environments of the projects, the token-user has access to.

### Security
The `GITLAB_BASE_URL` and `GITLAB_API_TOKEN` values are injected into the nginx-reverse-proxy at runtime. They are not exposed to the client in any way. In the future, the reverse proxy will be limited to only allow GET-requests, which will further enhance security.

### Getting started
To run the service, simply run the following command:
```bash
docker run -p 80:80 -e GITLAB_BASE_URL=[GITLAB_BASE_URL] -e GITLAB_API_TO
KEN=[GITLAB_API_TOKEN] creagas/gitlab_deployment_dashboard:latest
```