// api/routes/devices.js (updated)
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/devices
router.get('/', async (req, res) => {
  try {
    const devices = await prisma.device.findMany();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Не удалось получить список устройств' });
  }
});

// POST /api/devices
router.post('/', async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Нужен идентификатор устройства' });
  }
  try {
    const device = await prisma.device.create({ data: { identifier } });
    res.status(201).json(device);
  } catch (err) {
    console.error('Error creating device:', err);
    res.status(500).json({ error: 'Не удалось создать устройство' });
  }
});

module.exports = router;