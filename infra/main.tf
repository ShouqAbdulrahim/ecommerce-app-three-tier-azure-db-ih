# ===================== Resource Group =====================
resource "azurerm_resource_group" "rg" {
  name     = var.rg_name
  location = var.location
  tags     = var.tags
}

# ===================== Network (VNet + Subnets) =====================
resource "azurerm_virtual_network" "vnet" {
  name                = var.vnet_name
  address_space       = [var.vnet_cidr]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tags                = var.tags
}

resource "azurerm_subnet" "aks" {
  name                 = var.subnet_aks_name
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.subnet_aks_cidr]
}

resource "azurerm_subnet" "privatelink" {
  name                 = var.subnet_pl_name
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.subnet_pl_cidr]
}

# ===================== ACR =====================
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Standard"
  admin_enabled       = true
  tags                = var.tags
}

# ===================== AKS (Managed Identity + Azure CNI Overlay) =====================
resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "${var.prefix}-aks"
  tags                = var.tags

  default_node_pool {
    name                         = "sysnp"
    node_count                   = var.aks_node_count
    vm_size                      = var.aks_vm_size
    vnet_subnet_id               = azurerm_subnet.aks.id
    only_critical_addons_enabled = false
    upgrade_settings {
      max_surge = "33%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay" # يقلل استهلاك عناوين IP داخل الـVNet
    load_balancer_sku   = "standard"
    outbound_type       = "loadBalancer"
  }

  # يسهّل ربط Workload Identity لاحقا (اختياري)
  oidc_issuer_enabled               = true
  role_based_access_control_enabled = true
}

# AKS (kubelet identity) -> ACR AcrPull
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"

  # kubelet identity object id
  principal_id = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id

  depends_on = [azurerm_kubernetes_cluster.aks, azurerm_container_registry.acr]
}

# ===================== Azure SQL (Server + Database) =====================
resource "azurerm_mssql_server" "sql" {
  name                         = var.sql_server_name
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_admin_password

  public_network_access_enabled = false # مهم!
  minimum_tls_version           = "1.2"
  tags                          = var.tags
}

resource "azurerm_mssql_database" "db" {
  name           = var.sql_db_name
  server_id      = azurerm_mssql_server.sql.id
  sku_name       = "S0"
  zone_redundant = false
  tags           = var.tags
}

# ===================== Private DNS Zone for SQL =====================
resource "azurerm_private_dns_zone" "sql" {
  name                = "privatelink.database.windows.net"
  resource_group_name = azurerm_resource_group.rg.name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "sql_link" {
  name                  = "${var.prefix}-sql-vnet-link"
  private_dns_zone_name = azurerm_private_dns_zone.sql.name
  resource_group_name   = azurerm_resource_group.rg.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false
}

# ===================== Private Endpoint (SQL) =====================
resource "azurerm_private_endpoint" "sql_pe" {
  name                = "${var.prefix}-sql-pe"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  subnet_id           = azurerm_subnet.privatelink.id
  tags                = var.tags

  private_service_connection {
    name                           = "${var.prefix}-sql-psc"
    is_manual_connection           = false
    private_connection_resource_id = azurerm_mssql_server.sql.id
    subresource_names              = ["sqlServer"]
  }

  private_dns_zone_group {
    name                 = "sql-dns-zg"
    private_dns_zone_ids = [azurerm_private_dns_zone.sql.id]
  }
}

# ===================== Public IP (Static) للـIngress Controller =====================
resource "azurerm_public_ip" "ingress_ip" {
  name                = "${var.prefix}-ingress-pip"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}