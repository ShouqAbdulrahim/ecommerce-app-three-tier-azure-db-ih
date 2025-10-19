output "resource_group" {
  value = azurerm_resource_group.rg.name
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "aks_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

# تحصلي الـkubeconfig بأمر az لاحقًا:
# az aks get-credentials -g <RG> -n <AKS_NAME>

# IP العام الثابت للـIngress Controller (استخدميه في Helm values)
output "ingress_public_ip_name" {
  value = azurerm_public_ip.ingress_ip.name
}

output "ingress_public_ip" {
  value = azurerm_public_ip.ingress_ip.ip_address
}

# FQDN الخاص للسيرفر (يظهر بعد إنشاء الـPE/DNS)
# ملاحظة: قد يستغرق دقائق حتى يتوفر الـA record
output "sql_private_fqdn_hint" {
  description = "Private DNS Zone for SQL. The actual private FQDN resolves inside the VNet after PE creation."
  value       = "Use '<your-sql-server-name>.privatelink.database.windows.net' inside AKS"
}

output "sql_server_id" {
  value = azurerm_mssql_server.sql.id
}

output "sql_db_name" {
  value = azurerm_mssql_database.db.name
}