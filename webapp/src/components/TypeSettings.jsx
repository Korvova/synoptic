// src/components/TypeSettings.jsx
import React, { useEffect, useState } from 'react';
import api from '../service/api';

const fields = [
  { key: 'noId', label: 'Без ID' },
  { key: 'withId', label: 'С ID' },
  { key: 'on', label: 'Вкл' },
  { key: 'off', label: 'Выкл' },
];

export default function TypeSettings() {
  const [types, setTypes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [field, setField] = useState(fields[0].key);
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.get('/types').then(res => setTypes(res.data));
  }, []);

  const handleUpload = async e => {
    e.preventDefault();
    if (!selected || !file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(
      `/types/${selected}/upload?field=${field}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    setTypes(ts =>
      ts.map(t => (t.id === res.data.id ? res.data : t))
    );
    alert('Загружено!');
  };

  return (
    <div>
      <h2>Настройка типов элементов</h2>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th><th>Имя</th>
            {fields.map(f => <th key={f.key}>{f.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {types.map(t => (
            <tr
              key={t.id}
              style={{
                background: selected === t.id ? '#eef' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => setSelected(t.id)}
            >
              <td>{t.id}</td>
              <td>{t.name}</td>
              <td>{t.imgNoId && <img src={`/synoptic${t.imgNoId}`} width={40} />}</td>
              <td>{t.imgWithId && <img src={`/synoptic${t.imgWithId}`} width={40} />}</td>
              <td>{t.imgOn && <img src={`/synoptic${t.imgOn}`} width={40} />}</td>
              <td>{t.imgOff && <img src={`/synoptic${t.imgOff}`} width={40} />}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <form onSubmit={handleUpload} style={{ marginTop: '20px' }}>
          <h3>Загрузка для типа #{selected}</h3>
          <select
            value={field}
            onChange={e => setField(e.target.value)}
          >
            {fields.map(f => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>{' '}
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
          />{' '}
          <button type="submit">Загрузить</button>
        </form>
      )}
    </div>
  );
}
