#!/bin/bash
# Build and push Docker image with version timestamp

set -e

REGISTRY="registry.dawnfire.casa"
IMAGE_NAME="dashboard"
BUILD_TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
TAG="${BUILD_TIMESTAMP}"

echo "Building Docker image with version: ${TAG}"

docker build \
  --build-arg BUILD_TIMESTAMP="${TAG}" \
  -t "${REGISTRY}/${IMAGE_NAME}:${TAG}" \
  -t "${REGISTRY}/${IMAGE_NAME}:latest" \
  .

echo ""
echo "Build complete! Tags:"
echo "  ${REGISTRY}/${IMAGE_NAME}:${TAG}"
echo "  ${REGISTRY}/${IMAGE_NAME}:latest"
echo ""

read -p "Push to registry? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Pushing ${REGISTRY}/${IMAGE_NAME}:${TAG}..."
    docker push "${REGISTRY}/${IMAGE_NAME}:${TAG}"
    
    echo "Pushing ${REGISTRY}/${IMAGE_NAME}:latest..."
    docker push "${REGISTRY}/${IMAGE_NAME}:latest"
    
    echo ""
    echo "✓ Push complete!"
    echo ""
    echo "To deploy in K3s:"
    echo "  kubectl rollout restart deployment/dashboard -n dashboards"
    echo "  kubectl rollout status deployment/dashboard -n dashboards"
else
    echo "Skipping push."
fi