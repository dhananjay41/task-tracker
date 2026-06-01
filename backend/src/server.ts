import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { logger } from './utils/logger';
import prisma from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  socket.on('join', (userId: string) => {
    socket.join(userId);
    logger.info(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected');
  });
});

// Attach io to app for use in controllers
app.set('io', io);

async function start() {
  try {
    // Generates the client if not already generated
    // await prisma.$connect();
    logger.info('Prisma client connected (simulated)');
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error as string);
    process.exit(1);
  }
}

start();
export { io };
