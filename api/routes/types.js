const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/types — вернуть все типы элементов
router.get('/', async (req, res) => {
  try {
    const types = await prisma.elementType.findMany();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Не удалось получить типы элементов' });
  }
});

// POST /api/types — создать новый тип элемента
router.post('/', async (req, res) => {
  const { name, imgWithoutId, imgWithId, imgOn, imgOff } = req.body;
  try {
    const type = await prisma.elementType.create({
      data: { name, imgWithoutId, imgWithId, imgOn, imgOff }
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ error: 'Не удалось создать тип элемента' });
  }
});

module.exports = router;
