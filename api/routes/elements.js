const express = require('express');
const axios = require('axios');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: отправка вебхука
async function sendWebhook(roomId, event, element) {
  try {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (room?.webhookUrl) {
      const response = await axios.post(room.webhookUrl, { event, element });
      console.log(`Webhook sent to ${room.webhookUrl}, status ${response.status}`);
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
}

// GET /api/rooms/:roomId/elements — вернуть все элементы комнаты
router.get('/', async (req, res) => {
  const roomId = parseInt(req.params.roomId, 10);
  try {
    const elements = await prisma.element.findMany({ where: { roomId } });
    res.json(elements);
  } catch (error) {
    console.error('Error fetching elements:', error);
    res.status(500).json({ error: 'Не удалось получить элементы' });
  }
});

// POST /api/rooms/:roomId/elements — создать элемент
router.post('/', async (req, res) => {
  const roomId = parseInt(req.params.roomId, 10);
  const { typeId, x, y, volume, state, label, deviceId, presetId, userId, imgWithoutId, imgWithId, imgOn, imgOff } = req.body;
  try {
    const element = await prisma.element.create({
      data: { roomId, typeId, x, y, volume, state, label, deviceId, userId, imgWithoutId, imgWithId, imgOn, imgOff }
    });
    res.status(201).json(element);
    await sendWebhook(roomId, 'element.created', element);
  } catch (error) {
    console.error('Error creating element:', error);
    res.status(500).json({ error: 'Не удалось создать элемент' });
  }
});

// PUT /api/rooms/:roomId/elements/:id — обновить элемент
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { typeId, x, y, volume, state, label, deviceId, presetId, userId, imgWithoutId, imgWithId, imgOn, imgOff } = req.body;
  try {
    const element = await prisma.element.update({
      where: { id },
      data: { typeId, x, y, volume, state, label, deviceId, userId, presetId, imgWithoutId, imgWithId, imgOn, imgOff }
    });
    res.json(element);
    await sendWebhook(element.roomId, 'element.updated', element);
  } catch (error) {
    console.error('Error updating element:', error);
    res.status(500).json({ error: 'Не удалось обновить элемент' });
  }
});

// DELETE /api/rooms/:roomId/elements/:id — удалить элемент
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const element = await prisma.element.findUnique({ where: { id } });
    await prisma.element.delete({ where: { id } });
    res.status(204).end();
    if (element) await sendWebhook(element.roomId, 'element.deleted', element);
  } catch (error) {
    console.error('Error deleting element:', error);
    res.status(500).json({ error: 'Не удалось удалить элемент' });
  }
});

module.exports = router;
