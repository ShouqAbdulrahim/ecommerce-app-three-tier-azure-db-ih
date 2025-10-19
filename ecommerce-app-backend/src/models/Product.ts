import Database from '../config/database';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  stock?: number;
  isActive?: boolean;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class ProductModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    const query = `
      INSERT INTO Products (name, description, price, category, imageUrl, stock, isActive, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, GETDATE(), GETDATE())
    `;

    const result = await this.db.executeQuery(query, [
      productData.name,
      productData.description,
      productData.price,
      productData.category,
      productData.imageUrl,
      productData.stock,
      true
    ]);

    return result.recordset[0];
  }

  async getProductById(id: number): Promise<Product | null> {
    const query = 'SELECT * FROM Products WHERE id = @param0';
    const result = await this.db.executeQuery(query, [id]);
    return result.recordset[0] || null;
  }

  async getProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; total: number }> {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      isActive = true,
      page = 1,
      limit = 10
    } = filters;

    // Simple query without complex filtering for now
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM Products WHERE isActive = 1';
    const countResult = await this.db.executeQuery(countQuery, []);
    const total = countResult.recordset[0].total;

    // Get products with pagination
    const query = `
      SELECT * FROM Products 
      WHERE isActive = 1
      ORDER BY createdAt DESC
      OFFSET @param0 ROWS
      FETCH NEXT @param1 ROWS ONLY
    `;

    const result = await this.db.executeQuery(query, [offset, limit]);

    return {
      products: result.recordset,
      total
    };
  }

  async updateProduct(id: number, updateData: UpdateProductData): Promise<Product | null> {
    const fields = [];
    const values = [];
    let paramIndex = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateProductData] !== undefined) {
        fields.push(`${key} = @param${paramIndex}`);
        values.push(updateData[key as keyof UpdateProductData]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updatedAt = @param${paramIndex}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE Products 
      SET ${fields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @param${paramIndex + 1}
    `;

    const result = await this.db.executeQuery(query, values);
    return result.recordset[0] || null;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const query = 'DELETE FROM Products WHERE id = @param0';
    const result = await this.db.executeQuery(query, [id]);
    return result.rowsAffected[0] > 0;
  }

  async getCategories(): Promise<string[]> {
    const query = 'SELECT DISTINCT category FROM Products WHERE isActive = 1 ORDER BY category';
    const result = await this.db.executeQuery(query, []);
    return result.recordset.map((row: any) => row.category);
  }
}
