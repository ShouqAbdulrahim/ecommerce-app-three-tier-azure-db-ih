terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.49"
    }
    # (اختياري) Backend لتخزين الـstate على Storage Account لاحقًا
    # terraform {
    #   backend "azurerm" {
    #     resource_group_name  = "<state-rg>"
    #     storage_account_name = "<state-storage>"
    #     container_name       = "tfstate"
    #     key                  = "aks-3tier.tfstate"
    #   }
    # }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "4421688c-0a8d-4588-8dd0-338c5271d0af"
}