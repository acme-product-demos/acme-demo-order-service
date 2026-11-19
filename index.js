const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4003;

const SHIPPING_SERVICE_URL = process.env.SHIPPING_SERVICE_URL || "http://localhost:4007";
const MOCK_SESSION_HEADERS = process.env.MOCK_SESSION_ID
  ? { "x-mock-session": process.env.MOCK_SESSION_ID }
  : {};

app.use(cors());
app.use(express.json());

// Fetch shipment status from shipping-service for one orderId. On any
// failure (service down, network error, etc.) resolve to null so lookups
// degrade gracefully instead of failing.
async function fetchShipment(orderId) {
  try {
    const res = await fetch(`${SHIPPING_SERVICE_URL}/api/shipping/${orderId}`, {
      headers: { ...MOCK_SESSION_HEADERS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// In-memory data store
let orders = [];
let nextOrderId = 1;

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "order-service" });
});

// Create an order
app.post("/api/orders", (req, res) => {
  const { userId, items, total, paymentTransactionId } = req.body || {};

  if (typeof userId !== "string" || userId.trim().length === 0) {
    return res.status(400).json({ error: "userId is required and must be a non-empty string" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items is required and must be a non-empty array" });
  }

  const order = {
    id: `o${nextOrderId++}`,
    userId,
    items,
    total,
    paymentTransactionId: paymentTransactionId || null,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  orders.push(order);

  res.status(201).json(order);
});

// List orders (newest first), optionally filtered by userId
app.get("/api/orders", (req, res) => {
  const { userId } = req.query;

  let result = orders;
  if (userId) {
    result = result.filter((order) => order.userId === userId);
  }

  const sorted = [...result].reverse();

  res.status(200).json(sorted);
});

// Get a single order by id
app.get("/api/orders/:id", async (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const shipment = await fetchShipment(order.id);
  res.status(200).json({ ...order, shipping: shipment });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Order service listening on http://localhost:${PORT}`);
});
