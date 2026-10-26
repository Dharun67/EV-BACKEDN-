import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected to WebSocket: ${socket.id}`);

    // Join a station-specific room to receive updates just for that station
    socket.on('subscribe:station', (stationId: string) => {
      socket.join(`station:${stationId}`);
      console.log(`Socket ${socket.id} joined room station:${stationId}`);
    });

    // Leave the room when the user navigates away
    socket.on('unsubscribe:station', (stationId: string) => {
      socket.leave(`station:${stationId}`);
      console.log(`Socket ${socket.id} left room station:${stationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper function to get the initialized io instance anywhere in the backend
export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

// Helper to broadcast events to a specific station room
export const emitToStation = (stationId: string, event: string, payload: any) => {
  if (io) {
    io.to(`station:${stationId}`).emit(event, payload);
  }
};
