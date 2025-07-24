// File: src/components/RoomList.jsx
import React, { useEffect, useState } from 'react';
import api from '../service/api';

const RoomList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms');
        setRooms(response.data);
      } catch {
        setError('Не удалось загрузить список комнат');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) return <p>Загрузка...</p>;
  if (error)   return <p>{error}</p>;

  return (
    <ul>
      {rooms.map(room => (
        <li
          key={room.id}
          onClick={() => onSelectRoom(room.id)}
          style={{ cursor: 'pointer', padding: '8px 0' }}
        >
          {room.name}
        </li>
      ))}
    </ul>
  );
};

export default RoomList;
