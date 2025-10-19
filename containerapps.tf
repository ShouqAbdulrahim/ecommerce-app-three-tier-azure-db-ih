# ===============================
# Common locals (secret names)
# ===============================
locals {
  acr_pw_secret_name = "acr-pw"
  sql_pw_secret_name = "sql-pw"
}

# ===============================
# Backend Container App
# ===============================
resource "azurerm_container_app" "backend" {
  name                         = "${var.project_name}-backend"
  resource_group_name          = azurerm_resource_group.rg.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Single"

  # Secrets (ACR & SQL password)
  secret {
    name  = local.acr_pw_secret_name
    value = azurerm_container_registry.acr.admin_password
  }
  secret {
    name  = local.sql_pw_secret_name
    value = var.sql_admin_password
  }

  # ACR login for pulling images
  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = local.acr_pw_secret_name
  }

  template {
    container {
      name   = "backend"
      image  = "${azurerm_container_registry.acr.login_server}/ecom-backend:v7"
      cpu    = 0.5
      memory = "1Gi"

      # ===== DB envs =====
      env {
        name  = "DB_SERVER"
        value = azurerm_mssql_server.sql.fully_qualified_domain_name
      }
      env {
        name  = "DB_NAME"
        value = azurerm_mssql_database.db.name
      }
      env {
        name  = "DB_USER"
        value = var.sql_admin_user
      }
      env {
        name        = "DB_PASSWORD"
        secret_name = local.sql_pw_secret_name
      }
      env {
        name  = "DB_ENCRYPT"
        value = "true"
      }
      env {
        name  = "DB_TRUST_SERVER_CERTIFICATE"
        value = "false"
      }
      env {
        name  = "DB_CONNECTION_TIMEOUT"
        value = "30000"
      }

      # App config
      env {
        name  = "PORT"
        value = "3001"
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      # CORS: اسمح فقط لواجهة الفرونت (حدّثي هذا إذا تغيّر FQDN)
      env {
        name  = "CORS_ORIGIN"
        value = "https://ecommerce-app-frontend.happydune-6eeb4640.southeastasia.azurecontainerapps.io"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3001
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

# ===============================
# Frontend Container App
# ===============================
resource "azurerm_container_app" "frontend" {
  name                         = "${var.project_name}-frontend"
  resource_group_name          = azurerm_resource_group.rg.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Single"

  # ACR secret + registry
  secret {
    name  = local.acr_pw_secret_name
    value = azurerm_container_registry.acr.admin_password
  }
  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = local.acr_pw_secret_name
  }

  template {
    container {
      name   = "frontend"
      image  = "${azurerm_container_registry.acr.login_server}/ecom-frontend:v8"
      cpu    = 0.5
      memory = "1Gi"

      # اربطي الفرونت بالباكند (API URL)
      env {
        name  = "REACT_APP_API_URL"
        value = "https://ecommerce-app-backend.happydune-6eeb4640.southeastasia.azurecontainerapps.io/api"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}