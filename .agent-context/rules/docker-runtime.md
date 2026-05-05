# Docker Runtime Strategy (Dynamic Generation Required)

Use this rule when Docker is enabled in project context.

## 0. Latest Official Docker Guidance First
- Before generating or changing Dockerfiles, Compose files, or container runbooks, verify the latest official Docker documentation first.
- Use official Docker sources such as [Docker Compose Quickstart](https://docs.docker.com/compose/gettingstarted/), [Compose file reference](https://docs.docker.com/reference/compose-file/), and [Dockerfile best practices](https://docs.docker.com/build/building/best-practices/).
- Use current `docker compose` workflows and `compose.yaml`. Do not default to legacy `docker-compose` commands or stale file naming unless backward compatibility is a stated project requirement.
- Do not add the top-level Compose `version` field by default. The current Compose reference treats it as obsolete. Use it only when a compatibility requirement is explicit and documented.
- Use the latest stable compatible Docker base image, package-manager flow, and Compose syntax first. If the latest compatible path fails, step down intentionally and document the exact reason for the fallback.

## 1. Dynamic Generation Only
- Do not copy generic Docker templates blindly.
- Generate Docker assets based on actual stack, package manager, and runtime dependencies in the repository.
- Re-evaluate Docker instructions when dependencies, build tools, or runtime assumptions change.
- Use the latest stable compatible dependency line first. If an older dependency or base image must be pinned, explain the runtime or compatibility constraint that forced it.

## 2. Separate Development and Production Lanes
- Development lane and production lane are separate concerns.
- Development lane priorities: fast rebuild, hot reload support, debugger-friendly startup, local volume strategy.
- Production lane priorities: minimal image size, reproducible build, non-root runtime, strict startup command.

## 3. Security and Supply Chain
- Use minimal trusted base images with explicit versions.
- Use multi-stage builds for production images when possible.
- Avoid baking secrets into image layers.
- Keep runtime image free from build-only tooling.
- Use fresh base-image validation with `docker build --pull` and use `--no-cache` when a clean dependency refresh is required.
- Keep a `.dockerignore` strategy in mind so build contexts stay small and do not leak unnecessary files into the image.

## 4. Operational Clarity
- Docker instructions must document expected entrypoint and exposed ports.
- Local development command and production deployment command must be explicit.
- If Docker is not selected for the project, do not force containerization tasks.
- If Compose is used, document which file is the primary entrypoint, which services are dev-only versus production-facing, and why the chosen layout matches the current Docker docs rather than a legacy blog pattern.

## 5. Review Requirements
- Verify the generated Docker workflow matches selected runtime environment (Linux/WSL, Windows, macOS).
- Verify development and production instructions are not mixed into one unsafe image path.
- Ensure API and service health checks are compatible with container startup behavior.
- When Docker choices depend on official docs or release behavior, cite the Docker source and verification date in the generated docs or explanation so the next update can refresh them safely.
