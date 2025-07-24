const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const multer = require('multer');
const path = require('path');




// GET /api/rooms — вернуть все комнаты
router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (error) {
    console.error('Error GET /api/rooms:', error);
    res.status(500).json({ error: 'Не удалось получить список комнат' });
  }
});




// POST /api/rooms — создать новую комнату
router.post('/', async (req, res) => {
  try {
    const { name, background, webhookUrl } = req.body;
    const room = await prisma.room.create({
      data: { name, background, webhookUrl },
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Не удалось создать комнату' });
  }
});




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `room_${req.params.id}${ext}`);
  }
});
const upload = multer({ storage });







// GET /api/rooms/:id — получить одну комнату по id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Комната не найдена' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Не удалось получить комнату' });
  }
});









// PUT /api/rooms/:id — обновить поля комнаты
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, background, webhookUrl } = req.body;
  try {
    const room = await prisma.room.update({
      where: { id },
      data: { name, background, webhookUrl },
    });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Не удалось обновить комнату' });
  }
});

// DELETE /api/rooms/:id — удалить комнату и связанные элементы
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    // сначала удаляем все элементы комнаты
    await prisma.element.deleteMany({ where: { roomId: id } });
    // затем саму комнату
    await prisma.room.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Не удалось удалить комнату' });
  }
});







router.post(
  '/:id/background',
  upload.single('background'),
  async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    try {
      const room = await prisma.room.update({
        where: { id },
        data: { background: filePath }
      });


      res.json(room);
      



    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Не удалось сохранить фон' });
    }
  }
);








module.exports = router;
