# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "United States"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get User Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false
  }
}
```

#### Update User Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1987654321"
}
```

### Products

#### Get All Products
```http
GET /products?page=1&limit=10&category=Electronics&search=laptop&minPrice=100&maxPrice=1000
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category
- `search` (optional): Search term
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Wireless Bluetooth Headphones",
      "description": "High-quality wireless headphones...",
      "price": 199.99,
      "category": "Electronics",
      "imageUrl": "https://example.com/image.jpg",
      "stock": 50,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Product by ID
```http
GET /products/1
```

**Response:**
```json
{
  "product": {
    "id": 1,
    "name": "Wireless Bluetooth Headphones",
    "description": "High-quality wireless headphones...",
    "price": 199.99,
    "category": "Electronics",
    "imageUrl": "https://example.com/image.jpg",
    "stock": 50,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Categories
```http
GET /products/categories/list
```

**Response:**
```json
{
  "categories": ["Electronics", "Accessories", "Sports", "Appliances"]
}
```

#### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "category": "Electronics",
  "imageUrl": "https://example.com/image.jpg",
  "stock": 100
}
```

#### Update Product (Admin Only)
```http
PUT /products/1
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Product Name",
  "price": 149.99,
  "stock": 75
}
```

#### Delete Product (Admin Only)
```http
DELETE /products/1
Authorization: Bearer <admin-token>
```

### Cart

#### Get Cart Items
```http
GET /cart
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "userId": 1,
      "productId": 1,
      "quantity": 2,
      "productName": "Wireless Bluetooth Headphones",
      "productPrice": 199.99,
      "productImageUrl": "https://example.com/image.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 399.98,
  "itemCount": 2
}
```

#### Add Item to Cart
```http
POST /cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 1,
  "quantity": 1
}
```

#### Update Cart Item Quantity
```http
PUT /cart/update/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Item from Cart
```http
DELETE /cart/remove/1
Authorization: Bearer <token>
```

#### Clear Cart
```http
DELETE /cart/clear
Authorization: Bearer <token>
```

### Orders

#### Get User Orders
```http
GET /orders/my-orders?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "userId": 1,
      "status": "pending",
      "totalAmount": 399.98,
      "shippingAddress": "123 Main St, New York, NY 10001",
      "billingAddress": "123 Main St, New York, NY 10001",
      "paymentMethod": "credit_card",
      "paymentStatus": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "items": [
        {
          "id": 1,
          "orderId": 1,
          "productId": 1,
          "quantity": 2,
          "price": 199.99,
          "productName": "Wireless Bluetooth Headphones",
          "productImageUrl": "https://example.com/image.jpg"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

#### Get Order by ID
```http
GET /orders/1
Authorization: Bearer <token>
```

#### Create Order
```http
POST /orders/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 199.99
    }
  ],
  "shippingAddress": "123 Main St, New York, NY 10001",
  "billingAddress": "123 Main St, New York, NY 10001",
  "paymentMethod": "credit_card"
}
```

#### Create Order from Cart
```http
POST /orders/create-from-cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": "123 Main St, New York, NY 10001",
  "billingAddress": "123 Main St, New York, NY 10001",
  "paymentMethod": "credit_card"
}
```

#### Update Order Status (Admin Only)
```http
PUT /orders/1/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped"
}
```

#### Cancel Order
```http
PUT /orders/1/cancel
Authorization: Bearer <token>
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": ["Additional error details"]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Example Error Responses

#### Validation Error
```json
{
  "error": "Validation error",
  "details": [
    "Email is required",
    "Password must be at least 6 characters"
  ]
}
```

#### Authentication Error
```json
{
  "error": "Access token required"
}
```

#### Not Found Error
```json
{
  "error": "Product not found"
}
```

## Rate Limiting

The API implements rate limiting:
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Headers**: Rate limit information is included in response headers

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```
