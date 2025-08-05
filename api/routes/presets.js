// api/routes/presets.js
const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/presets
 * ──────────────────
 * ▸ ?cameraId=42 – вернуть только пресеты указанной камеры
 * ▸ без query     – вернуть все пресеты
 */
router.get('/', async (req, res) => {
  const cameraId = req.query.cameraId ? +req.query.cameraId : undefined;

  try {
    const presets = await prisma.preset.findMany({
      where: cameraId ? { cameraId } : undefined,
      include: { camera: { select: { id: true, identifier: true } } }
    });
    res.json(presets);
  } catch (err) {
    console.error('Error fetching presets:', err);
    res.status(500).json({ error: 'Не удалось получить список пресетов' });
  }
});

/**
 * POST /api/presets
 * ─────────────────
 * body: { cameraId: number, number: int, description?: string }
 */
router.post('/', async (req, res) => {
  const { cameraId, number, description } = req.body;

  if (!cameraId || !number) {
    return res.status(400).json({ error: 'Нужны cameraId и номер пресета' });
  }

  try {
    const preset = await prisma.preset.create({
      data: { cameraId: +cameraId, number: +number, description }
    });
    res.status(201).json(preset);
  } catch (err) {
    console.error('Error creating preset:', err);
    // нарушение @@unique([cameraId, number]) ловим как 409
    if (err.code === 'P2002') {
      return res
        .status(409)
        .json({ error: 'У этой камеры пресет с таким номером уже существует' });
    }
    res.status(500).json({ error: 'Не удалось создать пресет' });
  }
});






// DELETE /api/presets/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.preset.delete({ where:{ id:+req.params.id }});
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error:'Не удалось удалить пресет' });
  }
});





/**
 * POST /api/presets/:id/call
 * ──────────────────────────
 * Заготовка под «навести камеру». Сейчас просто 200 OK.
 */
router.post('/:id/call', async (req, res) => {
  const id = +req.params.id;
  try {
    // TODO: здесь разместите логику управления камерой
    console.log(`Call preset ${id}`);
    res.json({ ok: true, message: `Preset ${id} triggered` });
  } catch (err) {
    console.error('Error calling preset:', err);
    res.status(500).json({ error: 'Не удалось вызвать пресет' });
  }
});

module.exports = router;
