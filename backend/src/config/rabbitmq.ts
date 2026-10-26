import amqp, { Channel } from 'amqplib';

class RabbitMQService {
  private connection: any = null;
  private channel: Channel | null = null;
  public status: 'disconnected' | 'connecting' | 'ready' = 'disconnected';

  async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'ready') {
      return;
    }

    const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

    this.status = 'connecting';
    console.log('[RabbitMQ] Connecting to AMQP server...');

    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      
      this.connection!.on('error', (err: any) => {
        console.error('[RabbitMQ] Connection error:', err.message);
        this.status = 'disconnected';
        this.scheduleReconnect();
      });

      this.connection!.on('close', () => {
        console.warn('[RabbitMQ] Connection closed');
        this.status = 'disconnected';
        this.scheduleReconnect();
      });

      this.channel = await this.connection!.createChannel();
      
      // Setup Exchanges
      await this.channel!.assertExchange('gridwise.events', 'topic', { durable: true });
      
      // Setup Dead Letter Exchange
      await this.channel!.assertExchange('gridwise.dlx', 'fanout', { durable: true });
      await this.channel!.assertQueue('gridwise.dead-letter', { durable: true });
      await this.channel!.bindQueue('gridwise.dead-letter', 'gridwise.dlx', '');

      this.status = 'ready';
      console.log('[RabbitMQ] Connected successfully and channels initialized.');
    } catch (error: any) {
      console.error('[RabbitMQ] Failed to connect:', error.message);
      this.status = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    console.log('[RabbitMQ] Scheduling reconnect in 5 seconds...');
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not established');
    }
    return this.channel;
  }
}

export const rabbitMQService = new RabbitMQService();

export const connectRabbitMQ = async () => {
  await rabbitMQService.connect();
};
