import React, { useEffect, useState, useRef } from 'react';
import api from '../service/api';
import DraggableElement from './DraggableElement';
import CustomDragLayer from './CustomDragLayer';
import { withPrefix } from '../utils/pathHelpers';

const Canvas = ({ roomId, onBack }) => {
  const [room, setRoom] = useState(null);
  const [elements, setElements] = useState([]);
  const [typesMap, setTypesMap] = useState({});
  const [typesList, setTypesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [devicesList, setDevicesList] = useState([]);
  const [devicesMap, setDevicesMap] = useState({});


const [presetsList, setPresetsList] = useState([]);
const [presetModal, setPresetModal] = useState({
  open: false, elem: null, selected: ''
});


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


const [cameras, setCameras] = useState([]);
const [cameraModal, setCameraModal]   = useState({ open:false, identifier:'', name:'' });
const [presetCreate, setPresetCreate] = useState({ open:false, cameraId:'', number:'', description:'' });
const [presetDelete, setPresetDelete] = useState({ open:false, cameraId:'', presetId:'' });




const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 300,
};

const dialogStyle = {
  background: '#fff',
  padding: 20,
  borderRadius: 6,
  width: 300,
};










   // ─────────── ГРОМКОСТЬ ───────────
  const [volumeModal, setVolumeModal] = useState({ open: false, elem: null, value: 50 });
  

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
   const [roomRes, elemsRes, typesRes, usersRes, devicesRes, presetsRes, camerasRes] =
     await Promise.all([
       api.get(`/rooms/${roomId}`),
       api.get(`/rooms/${roomId}/elements`),
       api.get('/types'),
       api.get('/users'),
       api.get('/devices'),
       api.get('/presets'),           // все пресеты (или только нужной камеры)
       api.get('/cameras'),
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
      setPresetsList(presetsRes.data);
      setCameras(camerasRes.data);
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





  // ─────────── helpers громкости ───────────
  const openVolumeModal = (e, elem) => {
    e.stopPropagation();
    setVolumeModal({ open: true, elem, value: elem.volume ?? 50 });
    closeMenu();
  };

  const closeVolumeModal = () =>
    setVolumeModal({ open: false, elem: null, value: 50 });

  const saveVolume = async () => {
    const { elem, value } = volumeModal;
    const res = await api.put(
      `/rooms/${roomId}/elements/${elem.id}`,
      { volume: value }
    );
    setElements(e => e.map(x => x.id === elem.id ? res.data : x));
    closeVolumeModal();
  };






  const openPresetModal = (e, elem) => {
  e.stopPropagation();
  setPresetModal({ open: true, elem, selected: elem.presetId ?? '' });
  closeMenu();
};
const closePresetModal = () =>
  setPresetModal({ open: false, elem: null, selected: '' });

const savePresetLink = async () => {
  const { elem, selected } = presetModal;
  const res = await api.put(
    `/rooms/${roomId}/elements/${elem.id}`,
    { presetId: selected || null }
  );
  setElements(e => e.map(x => x.id === elem.id ? res.data : x));
  closePresetModal();
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
      { deviceId: device.id }
    );
    setElements(e => e.map(x => x.id === elem.id ? resE.data : x));
    closeDeviceModal();
  };

  const addElement = async typeId => {
    const rect = containerRef.current.getBoundingClientRect();
    const x0 = Math.round((rect.width - 40) / 2);
    const y0 = Math.round((rect.height - 40) / 2);
    const res = await api.post(`/rooms/${roomId}/elements`, {
      typeId, x: x0, y: y0, state: null
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




<button onClick={()=>setCameraModal({ open:true, identifier:'', name:'' })} style={{marginLeft:8}}>
  Добавить камеру
</button>
<button onClick={()=>setPresetCreate({ open:true, cameraId:'', number:'', description:'' })} style={{marginLeft:8}}>
  Добавить пресет
</button>
<button onClick={()=>setPresetDelete({ open:true, cameraId:'', presetId:'' })} style={{marginLeft:8}}>
  Удалить пресет
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
  ? <img src={withPrefix(type.imgNoId)} alt={type.name} width={24} height={24} />
  : <div style={{ width:24, height:24, background:'#eee'}} />}



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
  src={withPrefix(room.background)}
  alt=""
  style={{ width: '100%', display: 'block' }}
/>





                {elements.map(elem => {
                    const type = typesMap[elem.typeId] || {};
    let src = type.imgNoId;
if (elem.deviceId && type.imgWithId) src = type.imgWithId;
if (elem.state === 'on' && type.imgOn) src = type.imgOn;
if (elem.state === 'off' && type.imgOff) src = type.imgOff;
if (src) src = withPrefix(src);
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








{elem.presetId && (
  <img
    src={withPrefix('/synoptic/preset-camera.png')}
    alt=""
    title={`Preset #${presetsList.find(p => p.id === elem.presetId)?.number}`}
    style={{

     position: 'absolute',
     top: '50%',        // по вертикали по центру 40-px иконки
     left: -20,         // 4-px зазор: 16px значок + 4px «плечо»
     transform: 'translateY(-50%)',
     width: 16,
     height: 16,
     cursor: 'pointer'
    }}
    onClick={() => api.post(`/presets/${elem.presetId}/call`)}
  />
)}













{typeof elem.volume === 'number' && (
  <div
    style={{
      position: 'absolute',
      top: 44,          // чуть ниже иконки (40 px + 4 px отступ)
      left: 0,
      width: 40,
      height: 4,
      background: '#ccc',
      borderRadius: 2,
      overflow: 'hidden'
    }}
  >
    <div
      style={{
        width: `${Math.min(elem.volume, 100)}%`,
        height: '100%',
        background: '#2196f3'
      }}
    />
  </div>
)}








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
        onClick={e => openVolumeModal(e, menu.elem)}
        style={{ width:'100%' }}
      >
        Громкость…
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
    onClick={e => openPresetModal(e, menu.elem)}
    style={{ width:'100%' }}
  >
    Связать с пресетом…
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
                                confiance
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





{cameraModal.open && (
 <div style={overlayStyle} onClick={()=>setCameraModal({open:false})}>
  <div style={dialogStyle} onClick={e=>e.stopPropagation()}>
    <h4>Новая камера</h4>
    <input placeholder="identifier"
           value={cameraModal.identifier}
           onChange={e=>setCameraModal(m=>({...m,identifier:e.target.value}))}
           style={{width:'100%',marginBottom:6}}/>
    <input placeholder="Название (опц.)"
           value={cameraModal.name}
           onChange={e=>setCameraModal(m=>({...m,name:e.target.value}))}
           style={{width:'100%',marginBottom:12}}/>
    <div style={{textAlign:'right'}}>
      <button onClick={()=>setCameraModal({open:false})}>Отмена</button>
      <button style={{marginLeft:8}}
        onClick={async ()=>{
          const {identifier,name}=cameraModal;
          const res=await api.post('/cameras',{identifier,name});
          setCameras(c=>[...c,res.data]);
          setCameraModal({open:false});
        }}>Сохранить</button>
    </div>
  </div>
 </div>
)}


{presetCreate.open && (
 <div style={overlayStyle} onClick={()=>setPresetCreate({open:false})}>
  <div style={dialogStyle} onClick={e=>e.stopPropagation()}>
    <h4>Новый пресет</h4>

    <select value={presetCreate.cameraId}
            onChange={e=>setPresetCreate(m=>({...m,cameraId:e.target.value}))}
            style={{width:'100%',marginBottom:6}}>
      <option value="">-- выберите камеру --</option>
      {cameras.map(c=><option key={c.id} value={c.id}>{c.identifier||c.name}</option>)}
    </select>

    <input placeholder="Номер"
           value={presetCreate.number}
           onChange={e=>setPresetCreate(m=>({...m,number:e.target.value}))}
           style={{width:'100%',marginBottom:6}}/>

    <input placeholder="Описание (опц.)"
           value={presetCreate.description}
           onChange={e=>setPresetCreate(m=>({...m,description:e.target.value}))}
           style={{width:'100%',marginBottom:12}}/>

    {/* показать существующие номера */}
    {presetCreate.cameraId && (
      <p style={{fontSize:12, color:'#666'}}>
        Уже есть: {
          presetsList
            .filter(p=>p.cameraId===+presetCreate.cameraId)
            .map(p=>p.number).join(', ') || 'нет'
        }
      </p>
    )}

    <div style={{textAlign:'right'}}>
      <button onClick={()=>setPresetCreate({open:false})}>Отмена</button>
      <button style={{marginLeft:8}}
        onClick={async ()=>{
          const {cameraId,number,description}=presetCreate;
          const res=await api.post('/presets',{cameraId:+cameraId,number:+number,description});
          setPresetsList(p=>[...p,res.data]);
          setPresetCreate({open:false});
        }}>Сохранить</button>
    </div>
  </div>
 </div>
)}



{presetDelete.open && (
 <div style={overlayStyle} onClick={()=>setPresetDelete({open:false})}>
  <div style={dialogStyle} onClick={e=>e.stopPropagation()}>
    <h4>Удалить пресет</h4>

    <select value={presetDelete.cameraId}
            onChange={e=>setPresetDelete(m=>({...m,cameraId:e.target.value,presetId:''}))}
            style={{width:'100%',marginBottom:6}}>
      <option value="">-- камера --</option>
      {cameras.map(c=><option key={c.id} value={c.id}>{c.identifier||c.name}</option>)}
    </select>

    <select value={presetDelete.presetId}
            onChange={e=>setPresetDelete(m=>({...m,presetId:e.target.value}))}
            style={{width:'100%',marginBottom:12}}>
      <option value="">-- номер --</option>
      {presetsList
        .filter(p=>p.cameraId===+presetDelete.cameraId)
        .map(p=><option key={p.id} value={p.id}>№{p.number}</option>)}
    </select>

    <div style={{textAlign:'right'}}>
      <button onClick={()=>setPresetDelete({open:false})}>Отмена</button>
      <button style={{marginLeft:8, color:'red'}}
        onClick={async ()=>{
          await api.delete(`/presets/${presetDelete.presetId}`);
          setPresetsList(p=>p.filter(x=>x.id!==+presetDelete.presetId));
          setPresetDelete({open:false});
        }}>Удалить</button>
    </div>
  </div>
 </div>
)}




{presetModal.open && (
  <div
    onClick={closePresetModal}
    style={overlayStyle}
  >
    <div onClick={e=>e.stopPropagation()} style={dialogStyle}>
      <h4>Связать с пресетом камеры</h4>

      <label>Выбрать номер:</label><br/>
      <select
        value={presetModal.selected}
        onChange={e=>setPresetModal(m=>({ ...m, selected:+e.target.value }))}
        style={{ width:'100%', padding:4, margin:'8px 0' }}
      >
        <option value="">-- нет --</option>
        {presetsList.map(p=>(
          <option key={p.id} value={p.id}>
            №{p.number} · {p.camera.identifier}
          </option>
        ))}
      </select>

      <div style={{ textAlign:'right', marginTop:12 }}>
        {presetModal.elem.presetId && (
          <button
            onClick={()=>setPresetModal(m=>({...m, selected:''}))}
            style={{ marginRight: 'auto', color:'red' }}
          >
            Отвязать пресет
          </button>
        )}
        <button onClick={closePresetModal} style={{ marginRight:8 }}>
          Отмена
        </button>
        <button onClick={savePresetLink}>
          Сохранить
        </button>
      </div>
    </div>
  </div>
)}










{volumeModal.open && (
  <div
    onClick={closeVolumeModal}
    style={{
      position:'fixed', inset:0,
      background:'rgba(0,0,0,0.3)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:300
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{ background:'#fff', padding:20, borderRadius:6, width:300 }}
    >
      <h4>Установить громкость</h4>
      <input
        type="range" min="0" max="100"
        value={volumeModal.value}
        onChange={e =>
          setVolumeModal(m => ({ ...m, value: +e.target.value }))
        }
        style={{ width:'100%' }}
      />
      <p style={{ textAlign:'center', margin:8 }}>
        {volumeModal.value} %
      </p>
      <div style={{ textAlign:'right' }}>
        <button onClick={closeVolumeModal} style={{ marginRight:8 }}>
          Отмена
        </button>
        <button onClick={saveVolume}>Сохранить</button>
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