# RabbitMQ Integration for GridWise

GridWise uses **RabbitMQ** (via CloudAMQP or local) as its robust, asynchronous event broker. This decouples our services, ensuring that tasks like sending notifications, predictive maintenance checks, and system logging do not block the main API threads.

> [!CAUTION]
> **Architecture Rule:** RabbitMQ is **strictly** for asynchronous messaging and pub/sub events. It is **not** a permanent database, and it is **not** a fast key-value cache. Do not store permanent data solely in RabbitMQ.

## Configuration & Environment Variables

The backend requires the following environment variable to securely connect to your RabbitMQ instance. This must be stored in the `.env` file and **never committed**.

- `RABBITMQ_URL`: The full connection string for your RabbitMQ instance (e.g., `amqp://user:password@host:port`).

> [!WARNING]
> Never expose `RABBITMQ_URL` to the React frontend. It must remain securely on the Node.js backend.

## RabbitMQ Core Services

We centralize RabbitMQ interactions through two primary files:
1. `backend/src/config/rabbitmq.ts`: Handles the persistent connection, reconnection logic, and initialization of our default exchanges and queues.
2. `backend/src/services/eventService.ts`: Provides a strongly-typed `publishEvent` and `subscribeToEvent` API.

### Exchanges
GridWise relies heavily on **Topic Exchanges** to route messages dynamically.
- `gridwise.events`: The primary exchange. All standard events pass through here.
- `gridwise.dlx`: The Dead Letter Exchange (fanout).

### Core Events (Routing Keys)
Events use a standard format and semantic routing keys:
- `booking.created`
- `queue.joined`
- `queue.left`
- `station.availability.changed`
- `incident.created`
- `maintenance.predicted`
- `notification.requested`

### Standard Event Format
```json
{
  "eventId": "uuid-v4",
  "eventType": "booking.created",
  "timestamp": "ISO-8601",
  "version": 1,
  "source": "gridwise-api",
  "data": { ... }
}
```

## Resilience and Reliability

### 1. Connection Drops
If the AMQP connection drops, `rabbitmq.ts` will catch the `close` or `error` event and trigger a recursive reconnect with a 5-second backoff. The API will NOT crash. If a publish attempt occurs while disconnected, it will gracefully log a warning and return `false`.

### 2. Dead Letter Strategy
If a consumer encounters a fatal error while processing an event (and throws), it rejects the message (`channel.reject(msg, false)`). The queue is configured with `deadLetterExchange: 'gridwise.dlx'`, meaning that rejected message is instantly moved to the `gridwise.dead-letter` queue for later analysis or manual replay.

### 3. Idempotency
Because RabbitMQ guarantees "at-least-once" delivery, consumers must be idempotent. They should ideally check the incoming `eventId` against a fast cache (like Redis) to ensure duplicate events don't trigger duplicate database writes or notifications.

## Testing

The backend includes a health check at `/ready` that reports the status of MongoDB, Redis, and RabbitMQ. 

```json
{
  "success": true,
  "message": "GridWise API is fully ready",
  "mongodb": "connected",
  "redis": "connected",
  "rabbitmq": "connected"
}
```
