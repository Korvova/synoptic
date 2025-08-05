const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/cameras
router.get('/', async (_, res) => {
  const cams = await prisma.camera.findMany();
  res.json(cams);
});

// POST /api/cameras  { identifier, name }
router.post('/', async (req, res) => {
  const { identifier, name } = req.body;
  if (!identifier) return res.status(400).json({ error:'Нужен identifier' });
  const cam = await prisma.camera.create({ data:{ identifier, name }});
  res.status(201).json(cam);
});

module.exports = router;
