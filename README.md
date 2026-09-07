# photo-uploader-app

Application code for the Photo Uploader lab: a simple fullstack photo-gallery web app (no auth) that lets users upload photos with descriptions.

- Frontend: basic gallery UI — list images with descriptions, upload new photo + description
- Backend: API that stores images in Amazon S3 and description metadata in Amazon RDS PostgreSQL
- Infrastructure lives in a separate repo: [photo-uploader-infra](https://github.com/Eric-Obeng/photo-uploader-infra)

## CI/CD

A GitHub Actions workflow builds the container image on push and pushes it to Amazon ECR using OIDC (no long-lived AWS credentials). An EventBridge rule in the infra repo detects the new image and triggers a CodePipeline blue/green deployment via CodeDeploy.

## Repo layout

```text
backend/                          # Express API (S3 upload, RDS metadata, image listing, /health)
frontend/                         # React gallery UI (Vite)
Dockerfile                        # Multi-stage build: frontend assets + backend runtime
deploy/
  appspec.yaml.template            # CodeDeploy ECS blue/green appspec, rendered at build time
  taskdef.json.template            # ECS task definition, rendered at build time
.github/workflows/build-and-push.yml
```

## Deployment

Nothing to run manually here — every push to `main` triggers
`.github/workflows/build-and-push.yml`, which:

1. Authenticates to AWS via OIDC (no long-lived credentials).
2. Reads the deployed infra stack's outputs directly (`aws cloudformation describe-stacks`),
   so nothing infra-specific is hardcoded in this repo.
3. Builds the Docker image and pushes it tagged with the commit SHA.
4. Renders `deploy/appspec.yaml.template` and `deploy/taskdef.json.template` using those
   outputs, zips them, and uploads the bundle to the infra stack's pipeline-artifacts bucket.
5. Pushes the same image tagged `latest` — this is what the infra repo's EventBridge rule
   watches for, and it's pushed last so the deploy bundle is already in place before the
   pipeline (and CodeDeploy blue/green) kicks off.

### One-time setup

Set these as **repository secrets** (Settings → Secrets and variables → Actions → Secrets)
before the first push — see the infra repo's README for how to get the role ARN:

| Secret | Value |
| --- | --- |
| `APP_DEPLOY_ROLE_ARN` | `AppDeployRoleArn` output from `photo-uploader-infra`'s `github-oidc.yaml` stack |
| `AWS_REGION` | the region the infra is deployed to |
| `ROOT_STACK_NAME` | the stack name given to `root.yaml` when setting up CloudFormation Git sync |

## Status

Infra is deployed (root stack `CREATE_COMPLETE`, ECS service bootstrapped with
0 desired tasks since no image existed yet). This push triggers the first real
build-and-push run.
