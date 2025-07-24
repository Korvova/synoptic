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

app.use('/synoptic/api/devices', devicesRouter);
app.use('/synoptic/api/users', usersRouter);
app.use('/synoptic/api/rooms/:roomId/elements', elementsRouter);
app.use('/synoptic/api/types', typesRouter);
app.use('/synoptic/api/rooms', roomsRouter);

// Также статические файлы:
app.use('/synoptic/uploads', express.static(path.join(__dirname, 'uploads')));

// Плюс endpoint проверки здоровья:
app.get('/synoptic/api/ping', async (req, res) => {
  res.json({ status: 'ok' });
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
