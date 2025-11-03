# Azure Deployment Guide

This document explains how to deploy Beat the Kingz to Azure using Docker.

## Prerequisites

- Azure CLI installed (`az --version`)
- Docker installed
- Azure subscription
- GitHub repository access

## Deployment Options

### Option 1: Azure Container Instances (ACI) - Simplest

```bash
# Login to Azure
az login

# Create resource group
az group create --name beatthekingz-rg --location eastus

# Create Azure Container Registry (ACR)
az acr create --resource-group beatthekingz-rg \
  --name beatthekingzacr --sku Basic

# Login to ACR
az acr login --name beatthekingzacr

# Build and push Docker image
docker build -t beatthekingzacr.azurecr.io/beatthekingz:latest .
docker push beatthekingzacr.azurecr.io/beatthekingz:latest

# Deploy to Azure Container Instances
az container create \
  --resource-group beatthekingz-rg \
  --name beatthekingz-app \
  --image beatthekingzacr.azurecr.io/beatthekingz:latest \
  --dns-name-label beatthekingz \
  --ports 3000 \
  --cpu 1 \
  --memory 1.5 \
  --registry-login-server beatthekingzacr.azurecr.io \
  --registry-username <ACR_USERNAME> \
  --registry-password <ACR_PASSWORD>

# Get the URL
az container show --resource-group beatthekingz-rg \
  --name beatthekingz-app --query ipAddress.fqdn
```

Access your app at: `http://beatthekingz.eastus.azurecontainer.io:3000`

### Option 2: Azure App Service (Recommended for Production)

```bash
# Login to Azure
az login

# Create resource group
az group create --name beatthekingz-rg --location eastus

# Create App Service Plan (Linux)
az appservice plan create \
  --name beatthekingz-plan \
  --resource-group beatthekingz-rg \
  --is-linux \
  --sku B1

# Create Web App
az webapp create \
  --resource-group beatthekingz-rg \
  --plan beatthekingz-plan \
  --name beatthekingz \
  --deployment-container-image-name beatthekingzacr.azurecr.io/beatthekingz:latest

# Configure container registry
az webapp config container set \
  --name beatthekingz \
  --resource-group beatthekingz-rg \
  --docker-custom-image-name beatthekingzacr.azurecr.io/beatthekingz:latest \
  --docker-registry-server-url https://beatthekingzacr.azurecr.io \
  --docker-registry-server-user <ACR_USERNAME> \
  --docker-registry-server-password <ACR_PASSWORD>

# Enable continuous deployment
az webapp deployment container config \
  --enable-cd true \
  --name beatthekingz \
  --resource-group beatthekingz-rg
```

Access your app at: `https://beatthekingz.azurewebsites.net`

### Option 3: GitHub Actions CI/CD (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Login to Azure Container Registry
      uses: docker/login-action@v2
      with:
        registry: beatthekingzacr.azurecr.io
        username: ${{ secrets.ACR_USERNAME }}
        password: ${{ secrets.ACR_PASSWORD }}

    - name: Build and push Docker image
      run: |
        docker build -t beatthekingzacr.azurecr.io/beatthekingz:${{ github.sha }} .
        docker build -t beatthekingzacr.azurecr.io/beatthekingz:latest .
        docker push beatthekingzacr.azurecr.io/beatthekingz:${{ github.sha }}
        docker push beatthekingzacr.azurecr.io/beatthekingz:latest

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: beatthekingz
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        images: beatthekingzacr.azurecr.io/beatthekingz:${{ github.sha }}
```

## Quick Start Script

Run this script to deploy everything:

```bash
#!/bin/bash

# Variables
RESOURCE_GROUP="beatthekingz-rg"
LOCATION="eastus"
ACR_NAME="beatthekingzacr"
APP_NAME="beatthekingz"
APP_PLAN="beatthekingz-plan"

# Login
az login

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create ACR
az acr create --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME --sku Basic

# Build and push
az acr build --registry $ACR_NAME \
  --image $APP_NAME:latest .

# Create App Service
az appservice plan create \
  --name $APP_PLAN \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B1

az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_PLAN \
  --name $APP_NAME \
  --deployment-container-image-name $ACR_NAME.azurecr.io/$APP_NAME:latest

# Configure ACR integration
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_NAME.azurecr.io/$APP_NAME:latest

# Get URL
echo "App deployed at: https://$APP_NAME.azurewebsites.net"
```

## Environment Variables (for future backend)

When you add backend/database:

```bash
az webapp config appsettings set \
  --resource-group beatthekingz-rg \
  --name beatthekingz \
  --settings \
    DATABASE_URL="your-azure-postgresql-url" \
    NEXTAUTH_SECRET="your-secret" \
    NEXTAUTH_URL="https://beatthekingz.azurewebsites.net"
```

## Monitoring

```bash
# View logs
az webapp log tail --name beatthekingz --resource-group beatthekingz-rg

# View metrics
az monitor metrics list \
  --resource /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/beatthekingz-rg/providers/Microsoft.Web/sites/beatthekingz \
  --metric "Requests"
```

## Cost Estimation

- **Azure Container Instances**: ~$30/month (1 vCPU, 1.5GB RAM)
- **Azure App Service B1**: ~$13/month
- **Azure Container Registry Basic**: ~$5/month

**Total: ~$18-35/month for MVP clickthrough**

## Cleanup

To delete all resources:

```bash
az group delete --name beatthekingz-rg --yes --no-wait
```

## Notes

- Current deployment is frontend-only (no database)
- When adding backend, connect to Azure PostgreSQL
- Use Azure Blob Storage for file uploads
- Enable Application Insights for monitoring
- Set up custom domain and SSL certificate