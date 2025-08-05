/**
 * @api {post} /synoptic/api/command Отправить команду камере (VISCA over IP)
 * @apiName CameraCommand
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * @apiDescription
 * Единственный POST-эндпоинт, который принимает «конверт» команды и возвращает нормализованный ответ.
 * 
 * Тело запроса: объект с полями:
 * - `id` (строка) — корреляционный идентификатор;
 * - `target` (объект): { proto, ip, port, address };
 * - `request` (объект) — собственно команда (см. примеры ниже);
 * - `waitFor` — "none" | "ack" | "completed" (по умолчанию "ack");
 * - `timeoutMs` — таймаут ожидания (по умолчанию 1500);
 * - `retries` — повторы при таймауте (по умолчанию 0);
 * - `debug` — если true, вернёт сырые кадры `rxHex`.
 * 
 * **Эмулятор**: добавляйте `?scenario=ack|completed|timeout|errorNotExecutable|syntaxError|reply` к URL
 * (или оставляйте `auto` — тогда `query.* → reply`, длинные операции → `completed`, остальное → `ack`).
 * 
 * <div class="panel panel-info" style="margin:10px 0;">
 *   <div class="panel-heading"><b>Быстрые URL для эмулятора (скопируйте в поле «URL» ниже):</b></div>
 *   <div class="panel-body">
 *     <div style="margin-bottom:6px"><b>ACK</b>:
 *       <input type="text" class="form-control" readonly onclick="this.select()" value="/synoptic/api/command?scenario=ack">
 *     </div>
 *     <div style="margin-bottom:6px"><b>COMPLETED</b>:
 *       <input type="text" class="form-control" readonly onclick="this.select()" value="/synoptic/api/command?scenario=completed">
 *     </div>
 *     <div style="margin-bottom:6px"><b>TIMEOUT</b>:
 *       <input type="text" class="form-control" readonly onclick="this.select()" value="/synoptic/api/command?scenario=timeout&delayMs=1500">
 *     </div>
 *     <div style="margin-bottom:6px"><b>Ошибка (невыполнимо)</b>:
 *       <input type="text" class="form-control" readonly onclick="this.select()" value="/synoptic/api/command?scenario=errorNotExecutable">
 *     </div>
 *     <div style="margin-bottom:6px"><b>Синтаксическая ошибка</b>:
 *       <input type="text" class="form-control" readonly onclick="this.select()" value="/synoptic/api/command?scenario=syntaxError">
 *     </div>
 *     <div style="margin-bottom:6px"><b>Reply (для query.*)</b>:
 *       <input type="text" class="form-control" readonly onclick="this.select()" value="/synoptic/api/command?scenario=reply">
 *     </div>
 *     <p style="margin-top:10px;">Подставьте любой из этих путей в поле URL (или просто нажмите и Ctrl/Cmd+C, затем вставьте).</p>
 *   </div>
 * </div>
 * 
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=completed
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 * @apiSampleRequest /synoptic/api/command?scenario=reply
 * 
 * @apiSuccess (200) {Boolean} ok
 * @apiSuccess (200) {String="ack","completed","reply"} status
 * @apiSuccess (200) {Number} seq
 * @apiSuccess (200) {String} payloadType  Тип полезной нагрузки ответа (напр. visca-reply).
 * @apiSuccess (200) {String[]} [rxHex]    Сырые кадры ответа (если debug=true).
 * @apiSuccess (200) {Object} [parsed]     Распарсенные данные (для `query.*`).
 * 
 * @apiSuccessExample {json} Успех (ACK)
 * {
 *   "ok": true,
 *   "status": "ack",
 *   "seq": 42,
 *   "payloadType": "visca-reply",
 *   "rxHex": ["90 41 FF"],
 *   "detail": "Accepted"
 * }
 * 
 * @apiSuccessExample {json} Успех (COMPLETED)
 * {
 *   "ok": true,
 *   "status": "completed",
 *   "seq": 42,
 *   "payloadType": "visca-reply",
 *   "rxHex": ["90 41 FF", "90 51 FF"],
 *   "detail": "Completed"
 * }
 * 
 * @apiError (4xx/5xx) {String} status  "error" | "timeout"
 * @apiError (4xx/5xx) {Object} error   Детали ошибки
 * 
 * @apiErrorExample {json} Ошибка (таймаут ACK)
 * {
 *   "ok": false,
 *   "status": "timeout",
 *   "seq": 42,
 *   "error": { "code": "EPROTO_TIMEOUT_ACK", "message": "No ACK within timeout" }
 * }
 * 
 * @apiErrorExample {json} Ошибка (невыполнимо)
 * {
 *   "ok": false,
 *   "status": "error",
 *   "seq": 42,
 *   "payloadType": "visca-reply",
 *   "error": {
 *     "code": "ENOT_EXECUTABLE",
 *     "hex": "90 61 41 FF",
 *     "message": "Command cannot be executed in current state"
 *   }
 * }
 */

/**
 * ======================
 *  PTZ: drive / stop
 * ======================
 */

/**
 * @api {post} /synoptic/api/command PTZ: непрерывное движение
 * @apiName PtzDrive
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="ptz.drive"} request.type
 * @apiBody {String="left","right","up","down","upleft","upright","downleft","downright"} request.direction
 * @apiBody {Object} [request.speed]           По умолчанию {pan:16, tilt:16}
 * @apiBody {Number{1..24}} [request.speed.pan]
 * @apiBody {Number{1..20}} [request.speed.tilt]
 * @apiBody {Number} [request.durationMs]      Если не указать — движение до явного ptz.stop
 * 
 * @apiParamExample {json} запрос Post:
 * {
 *   "type": "ptz.drive",
 *   "direction": "left",
 *   "speed": { "pan": 16, "tilt": 16 },
 *   "durationMs": 700
 * }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "left-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "ptz.drive", "direction": "left", "speed": { "pan": 16, "tilt": 16 }, "durationMs": 700 },
 *   "waitFor": "ack",
 *   "timeoutMs": 1500
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=completed
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * @api {post} /synoptic/api/command PTZ: стоп
 * @apiName PtzStop
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="ptz.stop"} request.type
 * @apiBody {String[]} [request.axes]         ["pan","tilt"] по умолчанию обе
 * 
 * @apiParamExample {json} Стоп
 * { "type": "ptz.stop", "axes": ["pan","tilt"] }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "stop-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "ptz.stop", "axes": ["pan","tilt"] },
 *   "waitFor": "ack",
 *   "timeoutMs": 1000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * ======================
 *  PTZ: home / abs / rel
 * ======================
 */

/**
 * @api {post} /synoptic/api/command PTZ: Домой (Home)
 * @apiName PtzHome
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="ptz.home"} request.type
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "ptz.home" }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "home-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "ptz.home" },
 *   "waitFor": "ack",
 *   "timeoutMs": 2000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * @api {post} /synoptic/api/command PTZ: Абсолютное перемещение
 * @apiName PtzMoveAbs
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="ptz.move-abs"} request.type
 * @apiBody {Object} request.pan   {deg}|{visca}
 * @apiBody {Object} request.tilt  {deg}|{visca}
 * @apiBody {Object} [request.speed] {pan,tilt}
 * 
 * @apiParamExample {json} запрос Post:
 * {
 *   "type": "ptz.move-abs",
 *   "pan":  { "deg": 30.0 },
 *   "tilt": { "deg": -10.0 },
 *   "speed": { "pan": 12, "tilt": 8 }
 * }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "abs-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "ptz.move-abs", "pan": { "deg": 30.0 }, "tilt": { "deg": -10.0 }, "speed": { "pan": 12, "tilt": 8 } },
 *   "waitFor": "completed",
 *   "timeoutMs": 3000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=completed
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * @api {post} /synoptic/api/command PTZ: Относительное смещение
 * @apiName PtzMoveRel
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="ptz.move-rel"} request.type
 * @apiBody {Object} request.pan    {deg}|{visca}
 * @apiBody {Object} request.tilt   {deg}|{visca}
 * @apiBody {Object} [request.speed] {pan,tilt}
 * 
 * @apiParamExample {json} запрос Post:
 * {
 *   "type": "ptz.move-rel",
 *   "pan":  { "deg": 5.0 },
 *   "tilt": { "deg": -3.0 },
 *   "speed": { "pan": 10, "tilt": 6 }
 * }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "rel-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "ptz.move-rel", "pan": { "deg": 5.0 }, "tilt": { "deg": -3.0 }, "speed": { "pan": 10, "tilt": 6 } },
 *   "waitFor": "completed",
 *   "timeoutMs": 2500
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=completed
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * =========
 *  Zoom
 * =========
 */

/**
 * @api {post} /synoptic/api/command Zoom: drive (внутрь/наружу)
 * @apiName ZoomDrive
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="zoom.drive"} request.type
 * @apiBody {String="in","out"} request.direction
 * @apiBody {Number{0..7}} request.speed
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "zoom.drive", "direction": "in", "speed": 5 }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "z-in-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "zoom.drive", "direction": "in", "speed": 5 },
 *   "waitFor": "ack",
 *   "timeoutMs": 1000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * @api {post} /synoptic/api/command Zoom: stop
 * @apiName ZoomStop
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="zoom.stop"} request.type
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "zoom.stop" }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "z-stop-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "zoom.stop" },
 *   "waitFor": "ack",
 *   "timeoutMs": 800
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 */

/**
 * @api {post} /synoptic/api/command Zoom: перейти к позиции
 * @apiName ZoomLevel
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="zoom.level"} request.type
 * @apiBody {String} request.value  Значение зума: "0x0000".."0x4000"
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "zoom.level", "value": "0x2000" }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "z-pos-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "zoom.level", "value": "0x2000" },
 *   "waitFor": "completed",
 *   "timeoutMs": 2000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=completed
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * =========
 *  Focus
 * =========
 */

/**
 * @api {post} /synoptic/api/command Focus: режим авто/ручной
 * @apiName FocusMode
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="focus.mode"} request.type
 * @apiBody {String="auto","manual"} request.mode
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "focus.mode", "mode": "auto" }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "af-on-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "focus.mode", "mode": "auto" },
 *   "waitFor": "ack",
 *   "timeoutMs": 1000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * @api {post} /synoptic/api/command Focus: drive (near/far)
 * @apiName FocusDrive
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="focus.drive"} request.type
 * @apiBody {String="near","far"} request.direction
 * @apiBody {Number{0..7}} request.speed
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "focus.drive", "direction": "near", "speed": 3 }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "focus-near-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "focus.drive", "direction": "near", "speed": 3 },
 *   "waitFor": "ack",
 *   "timeoutMs": 1000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * @api {post} /synoptic/api/command Focus: stop
 * @apiName FocusStop
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="focus.stop"} request.type
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "focus.stop" }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "focus-stop-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "focus.stop" },
 *   "waitFor": "ack",
 *   "timeoutMs": 800
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 */

/**
 * @api {post} /synoptic/api/command Focus: One-Push AF
 * @apiName FocusOnePush
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="focus.one-push"} request.type
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "focus.one-push" }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "af-one-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "focus.one-push" },
 *   "waitFor": "completed",
 *   "timeoutMs": 2000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=completed
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * ==========
 *  Presets
 * ==========
 */

/**
 * @api {post} /synoptic/api/command Preset: save
 * @apiName PresetSave
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="preset.save"} request.type
 * @apiBody {Number} request.id  Идентификатор пресета (0..127)
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "preset.save", "id": 12 }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "psave-12",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "preset.save", "id": 12 },
 *   "waitFor": "ack",
 *   "timeoutMs": 1500
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * @api {post} /synoptic/api/command Preset: recall
 * @apiName PresetRecall
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="preset.recall"} request.type
 * @apiBody {Number} request.id
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "preset.recall", "id": 12 }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "precall-12",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "preset.recall", "id": 12 },
 *   "waitFor": "completed",
 *   "timeoutMs": 4000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=completed
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * @api {post} /synoptic/api/command Preset: clear
 * @apiName PresetClear
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="preset.clear"} request.type
 * @apiBody {Number} request.id
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "preset.clear", "id": 12 }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "pclear-12",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "preset.clear", "id": 12 },
 *   "waitFor": "ack",
 *   "timeoutMs": 1500
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 */

/**
 * ===============
 *  System / Raw
 * ===============
 */

/**
 * @api {post} /synoptic/api/command System: сброс VISCA sequence
 * @apiName SystemResetSeq
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="system.reset-seq"} request.type
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "system.reset-seq" }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "vreset-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "system.reset-seq" },
 *   "waitFor": "ack",
 *   "timeoutMs": 1000
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 */

/**
 * @api {post} /synoptic/api/command VISCA: сырая команда
 * @apiName ViscaRaw
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="visca.raw"} request.type
 * @apiBody {String="viscaCommand","viscaInquiry","control"} request.payloadType
 * @apiBody {String} request.tx  Hex-строка, напр. "81 01 06 01 10 10 01 03 FF"
 * @apiBody {Number} [request.seq]  Опционально, если не указать — адаптер подставит сам.
 * 
 * @apiParamExample {json} запрос Post:
 * {
 *   "type": "visca.raw",
 *   "payloadType": "viscaCommand",
 *   "tx": "81 01 06 01 10 10 01 03 FF"
 * }
 * 
 * @apiParamExample {json} пример:
 * {
 *   "id": "raw-left-001",
 *   "target": { "proto": "visca-ip", "ip": "192.168.1.123", "port": 52381, "address": 1 },
 *   "request": { "type": "visca.raw", "payloadType": "viscaCommand", "tx": "81 01 06 01 10 10 01 03 FF" },
 *   "waitFor": "ack",
 *   "timeoutMs": 1500,
 *   "debug": true
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=ack
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=errorNotExecutable
 * @apiSampleRequest /synoptic/api/command?scenario=reply
 */

/**
 * =========================
 *  Inquiry (Query / Reply)
 * =========================
 */

/**
 * @api {post} /synoptic/api/command Query: позиция PTZ
 * @apiName QueryPtzPosition
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="query.ptz-position"} request.type
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "query.ptz-position" }
 * 
 * @apiSuccessExample {json} ответ успех:
 * {
 *   "ok": true,
 *   "status": "reply",
 *   "seq": 55,
 *   "payloadType": "visca-reply",
 *   "parsed": {
 *     "kind": "ptz.position",
 *     "pan": 30.0,
 *     "tilt": -10.0,
 *     "raw": { "panVisca": "0x0288", "tiltVisca": "0xFE50" }
 *   }
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=reply
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=syntaxError
 */

/**
 * @api {post} /synoptic/api/command Query: позиция Zoom
 * @apiName QueryZoomPosition
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="query.zoom-position"} request.type
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "query.zoom-position" }
 * 
 * @apiSuccessExample {json} ответ успех:
 * {
 *   "ok": true,
 *   "status": "reply",
 *   "seq": 56,
 *   "payloadType": "visca-reply",
 *   "parsed": { "kind": "zoom.position", "value": 8192, "raw": "0x2000", "percent": 50.0 }
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=reply
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=syntaxError
 */

/**
 * @api {post} /synoptic/api/command Query: режим фокуса
 * @apiName QueryFocusMode
 * @apiGroup Camera
 * @apiVersion 1.0.0
 * 
 * @apiBody {Object} request
 * @apiBody {String="query.focus-mode"} request.type
 * 
 * @apiParamExample {json} запрос Post:
 * { "type": "query.focus-mode" }
 * 
 * @apiSuccessExample {json} ответ успех:
 * {
 *   "ok": true,
 *   "status": "reply",
 *   "seq": 57,
 *   "payloadType": "visca-reply",
 *   "parsed": { "kind": "focus.mode", "mode": "auto" }
 * }
 * 
 * @apiSampleRequest /synoptic/api/command?scenario=reply
 * @apiSampleRequest /synoptic/api/command?scenario=timeout
 * @apiSampleRequest /synoptic/api/command?scenario=syntaxError
 */

// Файл только для генерации документации apiDoc (эмулятор по адресу /synoptic/api/command).
module.exports = {};
