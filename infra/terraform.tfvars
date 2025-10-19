prefix          = "shop"
location        = "southeastasia"
rg_name         = "rg-shop-aks"
aks_name        = "aks-shop"
acr_name        = "shopshouqds"       # لازم يكون فريد وصغير
sql_server_name = "shopsqlsrvshouqds" # فريد
sql_db_name     = "shopdb"

vnet_name       = "vnet-shop"
vnet_cidr       = "10.50.0.0/16"
subnet_aks_name = "snet-aks"
subnet_aks_cidr = "10.50.1.0/24"
subnet_pl_name  = "snet-privatelink"
subnet_pl_cidr  = "10.50.2.0/24"

aks_node_count = 2
aks_vm_size    = "Standard_B2s"

sql_admin_login    = "sqladmin"
sql_admin_password = "StrongP@ssw0rd!!"

tags = {
  project = "3tier-aks"
  env     = "dev"
}