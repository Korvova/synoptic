// File: api/routes/users.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/users — получить всех пользователей
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Не удалось получить пользователей' });
  }
});

// POST /api/users — создать нового пользователя
router.post('/', async (req, res) => {
  const { identifier, name } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Нужен идентификатор пользователя' });
  }
  try {
    const user = await prisma.user.create({
      data: { identifier, name },
    });
    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Не удалось создать пользователя' });
  }
});

module.exports = router;
