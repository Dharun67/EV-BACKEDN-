import { v4 as uuidv4 } from 'uuid';
import { rabbitMQService } from '../config/rabbitmq';

export interface GridWiseEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: number;
  source: string;
  data: any;
}

const EXCHANGE_NAME = 'gridwise.events';

export const publishEvent = async (eventType: string, data: any): Promise<boolean> => {
  if (rabbitMQService.status !== 'ready') {
    console.warn(`[RabbitMQ] Not ready. Skipping publish for event: ${eventType}`);
    return false;
  }

  const channel = rabbitMQService.getChannel();
  
  const event: GridWiseEvent = {
    eventId: uuidv4(),
    eventType,
    timestamp: new Date().toISOString(),
    version: 1,
    source: 'gridwise-api',
    data
  };

  try {
    const payload = Buffer.from(JSON.stringify(event));
    
    // Publish to topic exchange
    const result = channel.publish(EXCHANGE_NAME, eventType, payload, {
      persistent: true,
      messageId: event.eventId,
      timestamp: Date.now()
    });

    if (result) {
      console.log(`[RabbitMQ] Published event: ${eventType} (${event.eventId})`);
    }
    return result;
  } catch (error) {
    console.error(`[RabbitMQ] Failed to publish event: ${eventType}`, error);
    return false;
  }
};

/**
 * Setup a generic consumer with idempotency and DLX logic
 */
export const subscribeToEvent = async (queueName: string, routingKey: string, handler: (event: GridWiseEvent) => Promise<void>) => {
  if (rabbitMQService.status !== 'ready') {
    // Retry initialization later if connection is not ready
    setTimeout(() => subscribeToEvent(queueName, routingKey, handler), 5000);
    return;
  }

  const channel = rabbitMQService.getChannel();
  
  // Assert Queue with DLX configured
  await channel.assertQueue(queueName, { 
    durable: true,
    deadLetterExchange: 'gridwise.dlx',
    deadLetterRoutingKey: queueName
  });
  
  await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    let event: GridWiseEvent | null = null;
    
    try {
      event = JSON.parse(msg.content.toString()) as GridWiseEvent;
      console.log(`[RabbitMQ] Consuming event: ${event.eventType} (${event.eventId}) on ${queueName}`);
      
      // In a real production app, we would check an idempotency store (like Redis or Mongo) here:
      const { redisCacheService } = await import('./redisCacheService');
      const isDuplicate = await redisCacheService.get(`idempotency:${event.eventId}`);
      if (isDuplicate) return channel.ack(msg);
      
      await handler(event);
      
      await redisCacheService.set(`idempotency:${event.eventId}`, 'processed', 86400); // 24h
      
      channel.ack(msg);
    } catch (error: any) {
      console.error(`[RabbitMQ] Consumer error on ${queueName}:`, error.message);
      
      // Retry logic could be implemented here via x-death headers, but for now we reject
      // false = don't requeue, send to dead-letter exchange
      channel.reject(msg, false);
    }
  });
};
