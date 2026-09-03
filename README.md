# photo-uploader-app

Application code for the Photo Uploader lab: a simple fullstack photo-gallery web app (no auth) that lets users upload photos with descriptions.

- Frontend: basic gallery UI — list images with descriptions, upload new photo + description
- Backend: API that stores images in Amazon S3 and description metadata in Amazon RDS PostgreSQL
- Infrastructure lives in a separate repo: [photo-uploader-infra](https://github.com/Eric-Obeng/photo-uploader-infra)

## CI/CD

A GitHub Actions workflow builds the container image on push and pushes it to Amazon ECR using OIDC (no long-lived AWS credentials). An EventBridge rule in the infra repo detects the new image and triggers a CodePipeline blue/green deployment via CodeDeploy.

## Repo layout

```
backend/       # API service (S3 upload, RDS metadata, image listing)
frontend/      # Photo gallery UI
Dockerfile
.github/workflows/build-and-push.yml
```

## Status

Scaffolding only — application code is being built out incrementally.
