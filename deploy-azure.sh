#!/bin/bash

# Beat the Kingz - Azure Deployment Script
# This script deploys the app to Azure App Service using Docker

set -e  # Exit on error

echo "🚀 Beat the Kingz - Azure Deployment"
echo "====================================="

# Variables
RESOURCE_GROUP="beatthekingz-rg"
LOCATION="eastus"
ACR_NAME="beatthekingzacr"
APP_NAME="beatthekingz"
APP_PLAN="beatthekingz-plan"

echo ""
echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Registry: $ACR_NAME"
echo "  App Name: $APP_NAME"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure
echo "📝 Logging in to Azure..."
az login

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION --output none || true

# Create Azure Container Registry
echo "🏗️  Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --output none || true

# Build and push image to ACR
echo "🔨 Building Docker image and pushing to ACR..."
az acr build \
  --registry $ACR_NAME \
  --image $APP_NAME:latest \
  . \
  --output table

# Create App Service Plan
echo "📋 Creating App Service Plan..."
az appservice plan create \
  --name $APP_PLAN \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B1 \
  --output none || true

# Create Web App
echo "🌐 Creating Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_PLAN \
  --name $APP_NAME \
  --deployment-container-image-name $ACR_NAME.azurecr.io/$APP_NAME:latest \
  --output none || true

# Enable managed identity for ACR access
echo "🔐 Configuring managed identity..."
az webapp identity assign \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --output none

# Configure ACR integration
echo "🔗 Configuring container registry..."
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_NAME.azurecr.io/$APP_NAME:latest \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io \
  --output none

# Enable continuous deployment
echo "♻️  Enabling continuous deployment..."
az webapp deployment container config \
  --enable-cd true \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --output none || true

# Restart the app
echo "🔄 Restarting web app..."
az webapp restart \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --output none

# Get the URL
APP_URL=$(az webapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv)

echo ""
echo "✅ Deployment complete!"
echo "====================================="
echo "🌍 Your app is now live at:"
echo "   https://$APP_URL"
echo ""
echo "📊 View logs:"
echo "   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "🗑️  To delete all resources:"
echo "   az group delete --name $RESOURCE_GROUP --yes --no-wait"
echo ""