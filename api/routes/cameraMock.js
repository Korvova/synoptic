// api/routes/cameraMock.js
const express = require('express');
const router = express.Router();

let seq = 1;

// хелперы
const ok = (status, extra = {}) => ({ ok: true, status, ...extra });
const err = (status, error, extra = {}) => ({ ok: false, status, error, ...extra });

/**
 * Сценарии:
 *   ack              — успешный ACK
 *   completed        — успешный COMPLETED
 *   timeout          — таймаут ожидания (вернём 504)
 *   errorNotExecutable — ошибка «невыполнимо сейчас» (409)
 *   syntaxError      — синтаксическая ошибка (422)
 *   reply            — ответ на запрос (для query.*)
 *   auto (по умолчанию):
 *       - для query.* → reply
 *       - для долгих команд (move-abs/rel, preset.recall, zoom.level, focus.one-push) → completed
 *       - иначе → ack
 */
router.post('/command', async (req, res) => {
  const { id, target = {}, request = {}, waitFor = 'ack', timeoutMs = 1500, debug = false } = req.body || {};
  const scenario = (req.query.scenario || req.body?.mock?.scenario || 'auto').toString();
  const delayMs = Math.min(parseInt(req.query.delayMs || 0, 10) || 0, 10000);

  // Последовательность (как в VISCA-IP): просто счётчик для вида
  const thisSeq = request.type === 'system.reset-seq' ? 0 : (seq++ & 0xFFFF);

  const base = {
    id,
    seq: thisSeq,
    // для system.reset-seq считаем ответом control-reply, иначе visca-reply
    payloadType: request.type === 'system.reset-seq' ? 'control-reply' : 'visca-reply'
  };

  // генераторы готовых ответов
  const samples = {
    ack: () => ok('ack',    { ...base, rxHex: debug ? ['90 41 FF'] : undefined, detail: 'Accepted' }),
    completed: () => ok('completed', { ...base, rxHex: debug ? ['90 41 FF','90 51 FF'] : undefined, detail: 'Completed' }),
    timeout: () => err('timeout', { code: waitFor === 'completed' ? 'EPROTO_TIMEOUT_COMPLETION' : 'EPROTO_TIMEOUT_ACK', message: 'Simulated timeout' }, base),
    errorNotExecutable: () => err('error', { code: 'ENOT_EXECUTABLE', hex: '90 61 41 FF', message: 'Command cannot be executed in current state' }, base),
    syntaxError: () => err('error', { code: 'EPROTO_SYNTAX', hex: '90 60 02 FF', message: 'Syntax error' }, base),
    replyPTZ: () => ok('reply', { ...base, parsed: { kind: 'ptz.position', pan: 30.0, tilt: -10.0, raw: { panVisca: '0x0288', tiltVisca: '0xFE50' } } }),
    replyZoom: () => ok('reply', { ...base, parsed: { kind: 'zoom.position', value: 8192, raw: '0x2000', percent: 50.0 } }),
    replyFocus: () => ok('reply', { ...base, parsed: { kind: 'focus.mode', mode: 'auto' } }),
    replyRaw: () => ok('reply', { ...base, parsed: { raw: '90 50 ... FF' } })
  };

  // авто-логика, если scenario=auto
  const auto = () => {
    if (request.type?.startsWith?.('query.')) {
      if (request.type === 'query.ptz-position') return samples.replyPTZ();
      if (request.type === 'query.zoom-position') return samples.replyZoom();
      if (request.type === 'query.focus-mode')    return samples.replyFocus();
      return samples.replyRaw();
    }
    const longOps = new Set(['ptz.move-abs','ptz.move-rel','preset.recall','zoom.level','focus.one-push']);
    return longOps.has(request.type) ? samples.completed() : samples.ack();
  };

  // выбираем сцену
  let resp;
  switch (scenario) {
    case 'ack':               resp = samples.ack(); break;
    case 'completed':         resp = samples.completed(); break;
    case 'timeout':           // 504
      await sleep(delayMs || timeoutMs);
      return res.status(504).json(samples.timeout());
    case 'errorNotExecutable': return res.status(409).json(samples.errorNotExecutable());
    case 'syntaxError':        return res.status(422).json(samples.syntaxError());
    case 'reply':
      if (request.type === 'query.ptz-position') return res.json(samples.replyPTZ());
      if (request.type === 'query.zoom-position') return res.json(samples.replyZoom());
      if (request.type === 'query.focus-mode')    return res.json(samples.replyFocus());
      return res.json(samples.replyRaw());
    case 'auto':
    default:
      resp = auto();
  }

  if (delayMs) await sleep(delayMs);
  return res.json(resp);
});

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

module.exports = router;
