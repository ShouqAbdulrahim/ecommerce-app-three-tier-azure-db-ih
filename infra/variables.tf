##############################################
# General Variables
##############################################

variable "prefix" {
  description = "Project prefix used for naming resources"
  type        = string
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "southeastasia"
}

variable "rg_name" {
  description = "Name of the Resource Group"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    project = "3tier-aks"
    env     = "dev"
  }
}

##############################################
# Network
##############################################

variable "vnet_name" {
  description = "Virtual Network name"
  type        = string
}

variable "vnet_cidr" {
  description = "Address space for the VNet"
  type        = string
  default     = "10.50.0.0/16"
}

variable "subnet_aks_name" {
  description = "Subnet name for AKS"
  type        = string
  default     = "snet-aks"
}

variable "subnet_aks_cidr" {
  description = "CIDR block for AKS subnet"
  type        = string
  default     = "10.50.1.0/24"
}

variable "subnet_pl_name" {
  description = "Subnet name for Private Link"
  type        = string
  default     = "snet-privatelink"
}

variable "subnet_pl_cidr" {
  description = "CIDR block for Private Link subnet"
  type        = string
  default     = "10.50.2.0/24"
}

##############################################
# ACR
##############################################

variable "acr_name" {
  description = "Azure Container Registry name (must be unique globally)"
  type        = string
}

##############################################
# AKS
##############################################

variable "aks_name" {
  description = "Azure Kubernetes Service cluster name"
  type        = string
}

variable "aks_node_count" {
  description = "Number of nodes in the default node pool"
  type        = number
  default     = 2
}

variable "aks_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D2s_v5"
}

##############################################
# Azure SQL
##############################################

variable "sql_server_name" {
  description = "SQL Server name"
  type        = string
}

variable "sql_db_name" {
  description = "Database name"
  type        = string
  default     = "shopdb"
}

variable "sql_admin_login" {
  description = "Administrator username for SQL Server"
  type        = string
  sensitive   = true
}

variable "sql_admin_password" {
  description = "Administrator password for SQL Server"
  type        = string
  sensitive   = true
}