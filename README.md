# order-service

Demo e-commerce backend microservice for order management. In-memory data only — no database, no persistence across restarts. Built for demo purposes (part of a larger multi-service e-commerce demo).

## Tech

- Node.js + Express (CommonJS)
- No TypeScript, no database

## Run

```bash
npm install
npm start
```

The server listens on `http://localhost:4003`.

## Endpoints

### Health check

```bash
curl http://localhost:4003/health
```

### Create an order

```bash
curl -X POST http://localhost:4003/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "u1",
    "items": [
      { "productId": "p1", "name": "Wireless Mouse", "price": 25.99, "quantity": 2 }
    ],
    "total": 51.98
  }'
```

Returns `201` with the created order:

```json
{
  "id": "o1",
  "userId": "u1",
  "items": [ { "productId": "p1", "name": "Wireless Mouse", "price": 25.99, "quantity": 2 } ],
  "total": 51.98,
  "status": "confirmed",
  "createdAt": "2026-09-22T12:00:00.000Z"
}
```

Returns `400` if `userId` (non-empty string) or `items` (non-empty array) is missing/invalid.

### List all orders

```bash
curl http://localhost:4003/api/orders
```

Returns all orders, newest first.

### List orders for a specific user

```bash
curl "http://localhost:4003/api/orders?userId=u1"
```

### Get a single order

```bash
curl http://localhost:4003/api/orders/o1
```

Returns `404 { "error": "Order not found" }` if the id doesn't exist.
