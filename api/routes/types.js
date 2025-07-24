// File: api/routes/types.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');

// Настройка хранения файлов для типов элементов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/types'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `type_${req.params.id}_${req.query.field}${ext}`);
  }
});
const upload = multer({ storage });

// GET /api/types — список всех типов элементов
router.get('/', async (req, res) => {
  try {
    const types = await prisma.elementType.findMany();
    res.json(types);
  } catch (err) {
    console.error('GET /api/types error:', err);
    res.status(500).json({ error: 'Не удалось получить список типов' });
  }
});

// GET /api/types/:id — получить один тип по ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const type = await prisma.elementType.findUnique({ where: { id } });
    if (!type) return res.status(404).json({ error: 'Тип не найден' });
    res.json(type);
  } catch (err) {
    console.error(`GET /api/types/${id} error:`, err);
    res.status(500).json({ error: 'Не удалось получить тип' });
  }
});

// POST /api/types — создать новый тип
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    const type = await prisma.elementType.create({ data: { name } });
    res.status(201).json(type);
  } catch (err) {
    console.error('POST /api/types error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Тип с таким именем уже существует' });
    }
    res.status(500).json({ error: 'Не удалось создать тип' });
  }
});

// POST /api/types/:id/upload?field=noId|withId|on|off
// Загрузка файла для одного из полей imgNoId, imgWithId, imgOn, imgOff
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const field = req.query.field; // ожидать noId, withId, on или off
  const map = {
    noId: 'imgNoId',
    withId: 'imgWithId',
    on: 'imgOn',
    off: 'imgOff',
  };

  if (!map[field]) {
    return res.status(400).json({ error: 'Неверное поле для загрузки' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const url = `/uploads/types/${req.file.filename}`;
  try {
    const updated = await prisma.elementType.update({
      where: { id },
      data: { [map[field]]: url }
    });
    res.json(updated);
  } catch (err) {
    console.error(`POST /api/types/${id}/upload error:`, err);
    res.status(500).json({ error: 'Не удалось сохранить картинку типа' });
  }
});

module.exports = router;
