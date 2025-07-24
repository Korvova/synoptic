// File: src/components/Canvas.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../service/api';
import DraggableElement from './DraggableElement';
import CustomDragLayer from './CustomDragLayer';

const Canvas = ({ roomId, onBack }) => {
  const [room, setRoom] = useState(null);
  const [elements, setElements] = useState([]);
  const [typesMap, setTypesMap] = useState({});
  const [typesList, setTypesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState({ visible: false, elem: null, x: 0, y: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bgTimestamp, setBgTimestamp] = useState(Date.now()); // ← добавили
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [roomRes, elemsRes, typesRes] = await Promise.all([
        api.get(`/rooms/${roomId}`),
        api.get(`/rooms/${roomId}/elements`),
        api.get('/types'),
      ]);
      setRoom(roomRes.data);
      setElements(elemsRes.data);
      setTypesList(typesRes.data);
      const map = {};
      typesRes.data.forEach(t => { map[t.id] = t; });
      setTypesMap(map);
      setLoading(false);
    };
    fetchAll();
  }, [roomId]);

  if (loading) return <p>Загрузка...</p>;
  if (!room)   return <p>Комната не найдена</p>;

  const closeMenu = () => setMenu({ visible: false, elem: null, x: 0, y: 0 });

  const openMenu = (e, elem) => {
    e.stopPropagation();
    setMenu({
      visible: true,
      elem,
      x: elem.x + 45,
      y: elem.y - 5,
    });
  };

  const toggleState = async () => {
    const elem = menu.elem;
    const newState = elem.state === 'on' ? 'off' : 'on';
    const res = await api.put(
      `/rooms/${roomId}/elements/${elem.id}`,
      { state: newState }
    );
    setElements(el => el.map(e => e.id === elem.id ? res.data : e));
    closeMenu();
  };

  const linkDevice = async () => {
    const id = menu.elem.id;
    const deviceId = prompt('Введите ID устройства:');
    if (!deviceId) return;
    const res = await api.put(
      `/rooms/${roomId}/elements/${id}`,
      { deviceId: Number(deviceId) }
    );
    setElements(el => el.map(e => e.id === id ? res.data : e));
    closeMenu();
  };

  const linkUser = async () => {
    const id = menu.elem.id;
    const userId = prompt('Введите ID пользователя:');
    if (!userId) return;
    const res = await api.put(
      `/rooms/${roomId}/elements/${id}`,
      { userId: Number(userId) }
    );
    setElements(el => el.map(e => e.id === id ? res.data : e));
    closeMenu();
  };

  const deleteElem = async () => {
    const id = menu.elem.id;
    await api.delete(`/rooms/${roomId}/elements/${id}`);
    setElements(el => el.filter(e => e.id !== id));
    closeMenu();
  };

  const addElement = async typeId => {
    const rect = containerRef.current.getBoundingClientRect();
    const defaultX = Math.round((rect.width  - 40) / 2);
    const defaultY = Math.round((rect.height - 40) / 2);
    const res = await api.post(`/rooms/${roomId}/elements`, {
      typeId,
      x: defaultX,
      y: defaultY,
      state: 'on'
    });
    setElements(e => [...e, res.data]);
    setPickerOpen(false);
  };

  const uploadBackground = async e => {
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
      setBgTimestamp(Date.now()); // ← обновляем штамп
    } catch (err) {
      console.error('Ошибка загрузки фона:', err);
    }
  };

  return (
    <div onClick={closeMenu} style={{ position: 'relative' }}>
      <button onClick={onBack} style={{ marginBottom: '10px' }}>← Назад</button>

      {/* Добавление нового элемента */}
      <button
        onClick={e => { e.stopPropagation(); setPickerOpen(!pickerOpen); }}
        style={{ marginLeft: 10 }}
      >
        Добавить элемент
      </button>
      {pickerOpen && (
        <div style={{
          position: 'absolute', top: 40, left: 10, background: '#fff',
          border: '1px solid #ccc', padding: 8, borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 200
        }}>
          {typesList.map(type => (
            <div
              key={type.id}
              onClick={() => addElement(type.id)}
              style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer' }}
            >
              {type.imgNoId
                ? <img src={type.imgNoId} alt={type.name} width={24} height={24} />
                : <div style={{ width:24, height:24, background:'#eee' }}/>
              }
              <span style={{ marginLeft: 8 }}>{type.name}</span>
            </div>
          ))}
        </div>
      )}

      <CustomDragLayer typesMap={typesMap} />

      <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
        <form onSubmit={uploadBackground} style={{ margin: '10px 0' }}>
          <input type="file" name="background" accept="image/*" />
          <button type="submit">Загрузить фон</button>
        </form>

        <img
          src={`${room.background}?cb=${bgTimestamp}`}
          alt=""
          style={{ width: '100%', display: 'block' }}
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
              onDrop={async (id, x, y) => {
                const r = await api.put(`/rooms/${roomId}/elements/${id}`, { x, y });
                setElements(el => el.map(e => e.id === id ? r.data : e));
              }}
            >
              <div onClick={e => openMenu(e, elem)}
                   style={{ position: 'absolute', top: -20, left: 0, zIndex: 10 }}>
                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  🔧
                </button>
              </div>
              <img src={src} alt="" style={{ width: 40, height: 40, pointerEvents: 'none' }} />
            </DraggableElement>
          );
        })}

        {menu.visible && (
          <div style={{
            position: 'absolute', top: menu.y, left: menu.x,
            background: '#fff', border: '1px solid #ccc', borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 100
          }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
              <li>
                <button onClick={toggleState} style={{ width: '100%' }}>
                  {menu.elem.state === 'on' ? 'Выключить' : 'Включить'}
                </button>
              </li>
              <li>
                <button onClick={linkDevice} style={{ width: '100%' }}>
                  Связать с устройством
                </button>
              </li>
              <li>
                <button onClick={linkUser} style={{ width: '100%' }}>
                  Связать с пользователем
                </button>
              </li>
              <li>
                <button onClick={deleteElem} style={{ width: '100%', color: 'red' }}>
                  Удалить
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
