import React, { useEffect, useState, useRef } from 'react';
import api from '../service/api';
import DraggableElement from './DraggableElement';
import CustomDragLayer from './CustomDragLayer';

const Canvas = ({ roomId, onBack }) => {
  const [room, setRoom] = useState(null);
  const [elements, setElements] = useState([]);
  const [typesMap, setTypesMap] = useState({});
  const [typesList, setTypesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [devicesList, setDevicesList] = useState([]);
  const [devicesMap, setDevicesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState({ visible: false, elem: null, x: 0, y: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [userModal, setUserModal] = useState({ open: false, elem: null });
  const [newUserName, setNewUserName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [deviceModal, setDeviceModal] = useState({ open: false, elem: null });
  const [newDeviceIdentifier, setNewDeviceIdentifier] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [roomRes, elemsRes, typesRes, usersRes, devicesRes] = await Promise.all([
        api.get(`/rooms/${roomId}`),
        api.get(`/rooms/${roomId}/elements`),
        api.get('/types'),
        api.get('/users'),
        api.get('/devices'),
      ]);
      setRoom(roomRes.data);
      setElements(elemsRes.data);
      setTypesList(typesRes.data);
      setUsersList(usersRes.data);
      setDevicesList(devicesRes.data);
      const typeMap = {};
      typesRes.data.forEach(t => { typeMap[t.id] = t; });
      setTypesMap(typeMap);
      const devMap = {};
      devicesRes.data.forEach(d => { devMap[d.id] = d; });
      setDevicesMap(devMap);
      setLoading(false);
    };
    fetchAll();
  }, [roomId]);

  if (loading) return <p>Загрузка...</p>;
  if (!room) return <p>Комната не найдена</p>;

  const closeMenu = () => setMenu({ visible: false, elem: null, x: 0, y: 0 });
  const openMenu = (e, elem) => {
    e.stopPropagation();
    setMenu({ visible: true, elem, x: elem.x + 45, y: elem.y - 5 });
  };

  const toggleState = async () => {
    const elem = menu.elem;
    const newState = elem.state === 'on' ? 'off' : 'on';
    const res = await api.put(
      `/rooms/${roomId}/elements/${elem.id}`,
      { state: newState }
    );
    setElements(e => e.map(x => x.id === elem.id ? res.data : x));
    closeMenu();
  };

  const deleteElem = async () => {
    const id = menu.elem.id;
    await api.delete(`/rooms/${roomId}/elements/${id}`);
    setElements(e => e.filter(x => x.id !== id));
    closeMenu();
  };

  const openUserModal = (e, elem) => {
    e.stopPropagation();
    setUserModal({ open: true, elem });
    closeMenu();
  };

  const closeUserModal = () => {
    setUserModal({ open: false, elem: null });
    setNewUserName('');
    setSelectedUserId('');
  };

  const linkUser = async () => {
    const { elem } = userModal;
    let user;
    if (selectedUserId) {
      user = usersList.find(u => u.id === +selectedUserId);
    } else if (newUserName.trim()) {
      const resU = await api.post('/users', {
        identifier: newUserName.trim(),
        name: newUserName.trim()
      });
      user = resU.data;
      setUsersList(u => [...u, user]);
    } else {
      return;
    }
    const resE = await api.put(
      `/rooms/${roomId}/elements/${elem.id}`,
      { userId: user.id, label: user.name }
    );
    setElements(e => e.map(x => x.id === elem.id ? resE.data : x));
    closeUserModal();
  };

  const openDeviceModal = (e, elem) => {
    e.stopPropagation();
    setDeviceModal({ open: true, elem });
    closeMenu();
  };

  const closeDeviceModal = () => {
    setDeviceModal({ open: false, elem: null });
    setNewDeviceIdentifier('');
    setSelectedDeviceId('');
  };

  const linkDevice = async () => {
    const { elem } = deviceModal;
    let device;
    if (selectedDeviceId) {
      device = devicesList.find(d => d.id === +selectedDeviceId);
    } else if (newDeviceIdentifier.trim()) {
      const resD = await api.post('/devices', { identifier: newDeviceIdentifier.trim() });
      device = resD.data;
      setDevicesList(d => [...d, device]);
      setDevicesMap(m => ({ ...m, [device.id]: device }));
    } else {
      return;
    }
    const resE = await api.put(
      `/rooms/${roomId}/elements/${elem.id}`,
      { deviceId: device.id, label: elem.userId ? usersList.find(u => u.id === elem.userId)?.name : null }
    );
    setElements(e => e.map(x => x.id === elem.id ? resE.data : x));
    closeDeviceModal();
  };

  const addElement = async typeId => {
    const rect = containerRef.current.getBoundingClientRect();
    const x0 = Math.round((rect.width - 40) / 2);
    const y0 = Math.round((rect.height - 40) / 2);
    const res = await api.post(`/rooms/${roomId}/elements`, {
      typeId, x: x0, y: y0, state: 'on'
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
    const res = await api.post(
      `/rooms/${roomId}/background`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    setRoom(res.data);
  };

  return (
    <div onClick={closeMenu} style={{ position: 'relative' }}>
      <button onClick={onBack} style={{ marginBottom: '10px' }}>← Назад</button>
      <button
        onClick={e => { e.stopPropagation(); setPickerOpen(!pickerOpen); }}
        style={{ marginLeft: 10 }}
      >
        Добавить элемент
      </button>
      {pickerOpen && (
        <div style={{
          position: 'absolute', top: 40, left: 10, zIndex: 200,
          background: '#fff', border: '1px solid #ccc',
          padding: 8, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {typesList.map(type => (
            <div
              key={type.id}
              onClick={() => addElement(type.id)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '4px 8px', cursor: 'pointer'
              }}
            >
              {type.imgNoId
                ? <img src={type.imgNoId} alt={type.name} width={24} height={24}/>
                : <div style={{ width:24, height:24, background:'#eee'}}/>}
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
          src={room.background}
          alt=""
          style={{ width: '100%', display: 'block' }}
        />
        {elements.map(elem => {
          const type = typesMap[elem.typeId] || {};
          let src = type.imgNoId;
          if ((elem.deviceId || elem.userId) && type.imgWithId) src = type.imgWithId;
          if (elem.state === 'on' && type.imgOn) src = type.imgOn;
          if (elem.state === 'off' && type.imgOff) src = type.imgOff;
          return (
            <DraggableElement
              key={elem.id}
              elem={elem}
              onDrop={async (id, x, y) => {
                const r = await api.put(
                  `/rooms/${roomId}/elements/${id}`,
                  { x, y }
                );
                setElements(e => e.map(x => x.id === id ? r.data : x));
              }}
            >
              <div
                onClick={e => openMenu(e, elem)}
                style={{ position: 'absolute', top: -20, left: 0, zIndex: 10 }}
              >
                <button
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >🔧</button>
              </div>
              <img
                src={src}
                alt=""
                style={{ width: 40, height: 40, pointerEvents: 'none' }}
              />
              {elem.label && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#000',
                  color: '#fff',
                  padding: '2px 4px',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  marginTop: 4
                }}>
                  {elem.label}
                </div>
              )}
            </DraggableElement>
          );
        })}
        {menu.visible && (
          <div style={{
            position: 'absolute', top: menu.y, left: menu.x,
            background: '#fff', border: '1px solid #ccc',
            borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 100
          }}>
            {menu.elem.deviceId && devicesMap[menu.elem.deviceId] && (
              <p style={{ padding: '4px 8px', margin: 0 }}>
                Устройство: {devicesMap[menu.elem.deviceId].identifier}
              </p>
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
              <li>
                <button onClick={toggleState} style={{ width: '100%' }}>
                  {menu.elem.state === 'on' ? 'Выключить' : 'Включить'}
                </button>
              </li>
              <li>
                <button
                  onClick={e => openUserModal(e, menu.elem)}
                  style={{ width: '100%' }}
                >
                  Связать с пользователем
                </button>
              </li>
              <li>
                <button
                  onClick={e => openDeviceModal(e, menu.elem)}
                  style={{ width: '100%' }}
                >
                  Связать с устройством
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
        {userModal.open && (
          <div
            onClick={closeUserModal}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.3)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 300
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', padding: 20, borderRadius: 6, width: 300 }}
            >
              <h4>Связать с пользователем</h4>
              <div style={{ marginBottom: 10 }}>
                <label>Ввести ФИО:</label><br />
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  style={{ width: '100%', padding: 4 }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Или выбрать из списка:</label><br />
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  style={{ width: '100%', padding: 4 }}
                >
                  <option value="">-- нет --</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.identifier}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button onClick={closeUserModal} style={{ marginRight: 8 }}>
                  Отмена
                </button>
                <button onClick={linkUser}>Добавить</button>
              </div>
            </div>
          </div>
        )}
        {deviceModal.open && (
          <div
            onClick={closeDeviceModal}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.3)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 300
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', padding: 20, borderRadius: 6, width: 300 }}
            >
              <h4>Связать с устройством</h4>
              <div style={{ marginBottom: 10 }}>
                <label>Ввести идентификатор:</label><br />
                <input
                  type="text"
                  value={newDeviceIdentifier}
                  onChange={e => setNewDeviceIdentifier(e.target.value)}
                  style={{ width: '100%', padding: 4 }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Или выбрать из списка:</label><br />
                <select
                  value={selectedDeviceId}
                  onChange={e => setSelectedDeviceId(e.target.value)}
                  style={{ width: '100%', padding: 4 }}
                >
                  <option value="">-- нет --</option>
                  {devicesList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.identifier}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button onClick={closeDeviceModal} style={{ marginRight: 8 }}>
                  Отмена
                </button>
                <button onClick={linkDevice}>Добавить</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;