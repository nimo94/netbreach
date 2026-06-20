import fastify from 'fastify';
import fastifySocketIo from 'fastify-socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocket } from './socket';

dotenv.config();

const app = fastify({ logger: true });

// Add Socket.io
app.register(fastifySocketIo, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware for headers
app.addHook('preHandler', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Explicit OPTIONS handler for CORS preflight
app.options('*', async (req, res) => {
  res.send();
});

// Basic Route
app.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Command Log Route (from Frontend terminal)
app.post('/session/log', async (request, reply) => {
  const { session_id, command, level, mission_type } = request.body as { session_id: string, command: string, level: number, mission_type: string };
  
  // Forward to AI Service
  try {
    const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/session/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, command, level, mission_type: mission_type || 'default' })
    });
    const aiData = await aiResponse.json();

    // If AI detects high pattern match, push event via WebSocket
    if (aiData.pattern_strength > 0.6) {
      app.io.emit('ai_alert', {
        type: 'countermeasure',
        message: aiData.message,
        vector: aiData.vector
      });
    }

    return { success: true, ai_status: aiData };
  } catch (error) {
    app.log.error('AI Service unreachable');
    return { success: true, ai_status: 'unreachable' };
  }
});

// AI Network Stats Route
app.get('/api/network', async (request, reply) => {
  try {
    const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/network`);
    const aiData = await aiResponse.json();
    return aiData;
  } catch (error) {
    app.log.error('AI Service unreachable');
    return { error: 'unreachable' };
  }
});

// AI Network Reset Route
app.post('/api/network/reset', async (request, reply) => {
  try {
    const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/network/reset`, { method: 'POST' });
    const aiData = await aiResponse.json();
    return aiData;
  } catch (error) {
    app.log.error('AI Service unreachable');
    return { error: 'unreachable' };
  }
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    
    app.ready(err => {
      if (err) throw err;
      setupSocket(app.io);
    });

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
