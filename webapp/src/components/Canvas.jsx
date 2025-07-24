// File: src/components/Canvas.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../service/api';
import DraggableElement from './DraggableElement';

const Canvas = ({ roomId, onBack }) => {
  const [room, setRoom] = useState(null);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomRes, elemsRes] = await Promise.all([
          api.get(`/rooms/${roomId}`),
          api.get(`/rooms/${roomId}/elements`),
        ]);
        setRoom(roomRes.data);
        setElements(elemsRes.data);
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
    <div>
      <button onClick={onBack} style={{ marginBottom: '10px' }}>
        ← Назад
      </button>

      {/* Загрузка фона */}
      <form
        onSubmit={async e => {
          e.preventDefault();
          const fileInput = e.target.elements.background;
          if (!fileInput.files.length) return;
          const formData = new FormData();
          formData.append('background', fileInput.files[0]);
          try {
            const res = await api.post(
              `/rooms/${roomId}/background`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            // Обновляем состояние комнаты целиком, включая новый путь background
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

      {/* Холст */}
      <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
        <img
          src={room.background || ''}
          alt="Фон комнаты"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        {elements.map(elem => (
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
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;
