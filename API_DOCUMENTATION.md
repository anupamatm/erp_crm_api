# ERP/CRM System API Documentation

## Base URL
All API endpoints are relative to the base URL: `http://your-domain/api`

## Authentication
All endpoints except authentication endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## API Endpoints

### Authentication

#### POST /auth/signup
Create a new user account
- **Body**: 
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "customer"  // Default role is customer
  }
  ```

#### POST /auth/signin
Login and get JWT token
- **Body**: 
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

#### POST /auth/signout
Logout user
- **Body**: 
  ```json
  {
    "refreshToken": "string"
  }
  ```

#### POST /auth/refresh
Refresh access token
- **Body**: 
  ```json
  {
    "refreshToken": "string"
  }
  ```

#### GET /auth/me
Get current user information
- **Roles**: All authenticated users
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

### Customers

#### GET /customers
List all customers
- **Roles**: admin, sales_manager, sales_exec
- **Query Parameters**:
  - page: number (optional)
  - limit: number (optional)
  - status: string (optional)

#### POST /customers
Create a new customer
- **Roles**: admin, sales_manager, sales_exec
- **Body**: 
  ```json
  {
    "name": "string",
    "email": "string",
    "phone": "string",
    "company": "string",
    "address": "string",
    "notes": "string",
    "status": "active"  // active, inactive, pending
  }
  ```

#### GET /customers/:id
Get customer details
- **Roles**: admin, sales_manager, sales_exec

#### PUT /customers/:id
Update customer information
- **Roles**: admin, sales_manager
- **Body**: Same as create customer

#### DELETE /customers/:id
Delete customer
- **Roles**: admin

#### GET /customers/:id/orders
Get customer's orders
- **Roles**: customer

#### GET /customers/:id/invoices
Get customer's invoices
- **Roles**: customer

#### GET /customers/:id/payments
Get customer's payment history
- **Roles**: customer

#### GET /customers/stats
Get customer statistics
- **Roles**: admin, sales_manager, sales_exec
- **Response**:
  ```json
  {
    "totalCustomers": number,
    "activeCustomers": number,
    "inactiveCustomers": number,
    "pendingCustomers": number,
    "revenueByMonth": {
      "current": number,
      "previous": number
    },
    "averageOrderValue": number,
    "customerLifetimeValue": number
  }
  ```

### Products

#### GET /products
List all products
- **Roles**: admin, sales_exec, inventory_manager
- **Query Parameters**:
  - page: number (optional)
  - limit: number (optional)
  - category: string (optional)

#### POST /products
Create a new product
- **Roles**: admin, inventory_manager
- **Body**: 
  ```json
  {
    "name": "string",
    "description": "string",
    "price": number,
    "category": "string",
    "stock": number,
    "imageUrl": "string"
  }
  ```

#### GET /products/:id
Get product details
- **Roles**: admin, sales_exec, inventory_manager

#### PUT /products/:id
Update product information
- **Roles**: admin, inventory_manager
- **Body**: Same as create product

#### DELETE /products/:id
Delete product
- **Roles**: admin

### Sales

#### GET /sales/dashboard
Get sales dashboard data
- **Roles**: admin, sales_manager, sales_exec

#### POST /sales/orders
Create a new sales order
- **Roles**: admin, sales_manager
- **Body**: 
  ```json
  {
    "customer": "ObjectId",
    "items": [
      {
        "product": "ObjectId",
        "quantity": number,
        "unitPrice": number
      }
    ],
    "billingAddress": {
      "street": "string",
      "city": "string",
      "state": "string",
      "postalCode": "string",
      "country": "string"
    },
    "terms": "string",
    "deliveryDate": "date",
    "total": number
  }
  ```

#### GET /sales/orders/:id
Get sales order details
- **Roles**: admin, sales_manager, sales_exec

#### PUT /sales/orders/:id
Update sales order
- **Roles**: admin, sales_manager
- **Body**: Same as create order

#### DELETE /sales/orders/:id
Delete sales order
- **Roles**: admin

#### GET /sales/last
Get last created sales order

### Invoices

#### GET /invoices
List all invoices
- **Roles**: admin, sales_manager, sales_exec
- **Query Parameters**:
  - page: number (optional)
  - limit: number (optional)
  - status: string (optional)

#### POST /invoices
Create a new invoice
- **Roles**: admin, sales_manager
- **Body**: 
  ```json
  {
    "customer": "ObjectId",
    "salesOrder": "ObjectId",
    "items": [
      {
        "product": "ObjectId",
        "description": "string",
        "quantity": number,
        "unitPrice": number,
        "discount": number,
        "tax": number
      }
    ],
    "subtotal": number,
    "discount": number,
    "tax": number,
    "totalAmount": number,
    "currency": "string",
    "issueDate": "date",
    "dueDate": "date",
    "billingAddress": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string"
    },
    "notes": "string",
    "terms": "string"
  }
  ```

#### GET /invoices/:id
Get invoice details
- **Roles**: admin, sales_manager, sales_exec

#### PUT /invoices/:id
Update invoice
- **Roles**: admin, sales_manager
- **Body**: Same as create invoice

#### DELETE /invoices/:id
Delete invoice
- **Roles**: admin

#### POST /invoices/:id/payments
Record a payment for an invoice
- **Roles**: admin, sales_manager
- **Body**: 
  ```json
  {
    "amount": number,
    "date": "date",
    "method": "string",  // cash, bank_transfer, credit_card, check, other
    "reference": "string",
    "notes": "string"
  }
  ```

#### GET /invoices/statistics
Get invoice statistics
- **Roles**: admin, sales_manager, sales_exec

### Opportunities

#### GET /opportunities
List all opportunities
- **Roles**: admin, sales_manager, sales_exec
- **Query Parameters**:
  - page: number (optional)
  - limit: number (optional)
  - stage: string (optional)

#### POST /opportunities
Create a new opportunity
- **Roles**: admin, sales_manager
- **Body**: 
  ```json
  {
    "title": "string",
    "customer": "ObjectId",
    "stage": "prospecting",  // prospecting, qualification, needs-analysis, proposal, negotiation, closed-won, closed-lost
    "value": number,
    "probability": number,
    "expectedCloseDate": "date",
    "products": [
      {
        "product": "ObjectId",
        "quantity": number
      }
    ],
    "source": "string",  // website, referral, cold-call, trade-show, social-media, email-campaign, other
    "description": "string",
    "nextAction": "follow-up",  // follow-up, meeting, proposal, presentation, contract, none
    "nextActionDate": "date",
    "competitors": [
      {
        "name": "string",
        "strengths": ["string"],
        "weaknesses": ["string"]
      }
    ]
  }
  ```

#### GET /opportunities/:id
Get opportunity details
- **Roles**: admin, sales_manager, sales_exec

#### PUT /opportunities/:id
Update opportunity
- **Roles**: admin, sales_manager
- **Body**: Same as create opportunity

#### DELETE /opportunities/:id
Delete opportunity
- **Roles**: admin

#### GET /opportunities/statistics
Get opportunity statistics
- **Roles**: admin, sales_manager, sales_exec

### Leads

#### GET /leads
List all leads
- **Roles**: admin, sales_manager, sales_exec
- **Query Parameters**:
  - page: number (optional)
  - limit: number (optional)
  - status: string (optional)
  - source: string (optional)

#### GET /leads/stats
Get lead statistics
- **Roles**: admin, sales_manager, sales_exec
- **Response**:
  ```json
  {
    "totalLeads": number,
    "byStatus": {
      "new": number,
      "contacted": number,
      "qualified": number,
      "unqualified": number,
      "converted": number,
      "lost": number
    },
    "bySource": {
      "website": number,
      "referral": number,
      "trade_show": number,
      "cold_call": number,
      "other": number
    }
  }
  ```

#### GET /leads/status/:status
Get leads by status
- **Roles**: admin, sales_manager, sales_exec
- **Path Parameters**:
  - status: string (new, contacted, qualified, unqualified, converted, lost)

#### GET /leads/source/:source
Get leads by source
- **Roles**: admin, sales_manager, sales_exec
- **Path Parameters**:
  - source: string (website, referral, trade_show, cold_call, other)

#### POST /leads
Create a new lead
- **Roles**: admin, sales_manager
- **Body**: 
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "company": "string",
    "source": "other",  // website, referral, trade_show, cold_call, other
    "status": "new",  // new, contacted, qualified, unqualified, converted, lost
    "priority": "medium",  // low, medium, high
    "notes": "string",
    "expectedRevenue": number,
    "closeDate": "date"
  }
  ```

#### GET /leads/:id
Get lead details
- **Roles**: admin, sales_manager, sales_exec

#### PUT /leads/:id
Update lead information
- **Roles**: admin, sales_manager
- **Body**: Same as create lead

#### DELETE /leads/:id
Delete lead
- **Roles**: admin

#### PUT /leads/:id/convert
Convert lead to customer
- **Roles**: admin, sales_manager

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "string",
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "string",
    "code": number,
    "details": {
      "field": "string",
      "message": "string"
    }
  }
}
```

#### Pagination Response
When endpoints support pagination, the response will include:
```json
{
  "success": true,
  "data": [items],
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## Error Codes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Role-Based Access Control

- **admin**: Full access to all features
- **sales_manager**: Access to sales, customers, and reports
- **sales_exec**: Access to sales and assigned customers
- **inventory_manager**: Access to products and inventory management
- **customer**: Access to own orders and invoices

## Additional Features

### Rate Limiting
- API requests are rate limited to prevent abuse
- Default limit: 100 requests per minute per IP
- Exceeding limits will return 429 Too Many Requests

### CORS
- CORS is enabled for the following origins:
  - Frontend application domain
  - localhost (for development)
- All requests must include the Origin header

### Request Headers
All requests should include:
- Content-Type: application/json
- Authorization: Bearer <token> (for protected routes)

### Response Headers
All responses include:
- X-RateLimit-Limit: Maximum number of requests allowed
- X-RateLimit-Remaining: Number of requests remaining
- X-RateLimit-Reset: Time when rate limit resets

## Best Practices

1. Always handle errors gracefully on the client side
2. Implement proper error logging
3. Use pagination for large datasets
4. Cache responses where appropriate
5. Implement proper error handling for network failures
6. Use HTTPS for all API requests
7. Implement proper session management
8. Use appropriate HTTP methods (GET, POST, PUT, DELETE)
9. Validate all input data
10. Implement proper error handling for invalid data

## Security Considerations

1. All endpoints are protected by JWT authentication
2. Role-based access control is implemented
3. Input validation is performed on all requests
4. SQL injection prevention is implemented
5. XSS prevention is implemented
6. CSRF protection is implemented
7. Rate limiting is implemented
8. Passwords are hashed using bcrypt
9. Sensitive data is encrypted
10. API keys are rotated regularly

## Versioning

The API uses semantic versioning:
- Major version changes: Breaking changes
- Minor version changes: Backward-compatible changes
- Patch version changes: Bug fixes

Current version: v1.0.0

## Changelog

### v1.0.0 (Initial Release)
- Complete API documentation
- Authentication system
- Customer management
- Product management
- Sales orders
- Invoices
- Opportunities
- Leads
- Statistics endpoints
- Role-based access control
- Error handling
- Pagination support
- Rate limiting
- Security features
