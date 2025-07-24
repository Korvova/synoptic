import React, { useEffect, useState, useRef } from 'react';
import api from '../service/api';
import DraggableElement from './DraggableElement';
import CustomDragLayer from './CustomDragLayer';

const Canvas = ({ roomId, onBack }) => {
  const [room, setRoom] = useState(null);
  const [elements, setElements] = useState([]);
  const [typesMap, setTypesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomRes, elemsRes, typesRes] = await Promise.all([
          api.get(`/rooms/${roomId}`),
          api.get(`/rooms/${roomId}/elements`),
          api.get('/types'),
        ]);
        setRoom(roomRes.data);
        setElements(elemsRes.data);
        const map = {};
        typesRes.data.forEach(t => { map[t.id] = t; });
        setTypesMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [roomId]);

  if (loading) return <p>Загрузка...</p>;
  if (!room)   return <p>Комната не найдена</p>;

  return (
    <div style={{ position: 'relative' }}>
      {/* Слой, рисующий перетаскиваемый элемент за курсором */}
      <CustomDragLayer typesMap={typesMap} />

      <button onClick={onBack} style={{ marginBottom: '10px' }}>
        ← Назад
      </button>

      {/* Загрузка фонового изображения */}
      <form
        onSubmit={async e => {
          e.preventDefault();
          const file = e.target.elements.background.files[0];
          if (!file) return;
          const fd = new FormData();
          fd.append('background', file);
          try {
            const res = await api.post(
              `/rooms/${roomId}/background`,
              fd,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setRoom(res.data);
          } catch (err) {
            console.error('Ошибка загрузки фона:', err);
          }
        }}
        style={{ margin: '10px 0' }}
      >
        <input type="file" name="background" accept="image/*" />
        <button type="submit">Загрузить фон</button>
      </form>

      {/* Собственно канвас */}
      <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
        <img
          src={room.background || ''}
          alt="Фон комнаты"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {elements.map(elem => {
          const type = typesMap[elem.typeId] || {};
          let src = type.imgNoId;
          if ((elem.deviceId || elem.userId) && type.imgWithId) src = type.imgWithId;
          if (elem.state === 'on'  && type.imgOn)  src = type.imgOn;
          if (elem.state === 'off' && type.imgOff) src = type.imgOff;

          return (
            <DraggableElement
              key={elem.id}
              elem={elem}
              containerRef={containerRef}
              onDrop={async (id, x, y) => {
                await api.put(`/rooms/${roomId}/elements/${id}`, { x, y });
                setElements(els =>
                  els.map(e => (e.id === id ? { ...e, x, y } : e))
                );
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  left: 0,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={e => { e.stopPropagation(); /* TODO: меню */ }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🔧
                </button>
              </div>
              <img
                src={src || ''}
                alt={type.name || 'element'}
                style={{
                  width: '40px',
                  height: '40px',
                  pointerEvents: 'none',
                }}
              />
            </DraggableElement>
          );
        })}
      </div>
    </div>
  );
};

export default Canvas;
