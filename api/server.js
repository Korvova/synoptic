require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const roomsRouter = require('./routes/rooms');
const elementsRouter = require('./routes/elements');
const typesRouter = require('./routes/types');
const devicesRouter = require('./routes/devices');
const usersRouter   = require('./routes/users');

const path = require('path');

app.use(express.json());

// Health check endpoint
app.get('/ping', async (req, res) => {
  res.json({ status: 'ok' });
});




app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/devices', devicesRouter);
app.use('/api/users',   usersRouter);


app.use('/api/rooms/:roomId/elements', elementsRouter);


app.use('/api/types', typesRouter);


app.use('/api/rooms', roomsRouter);


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
