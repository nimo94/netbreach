import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
    
    // We can add specific event listeners from the client here
    // Currently, the server emits 'ai_alert' and 'live_event'
  });
};
