// File: src/App.jsx
import React, { useState } from 'react';
import RoomList from './components/RoomList';
import Canvas from './components/Canvas';

export default function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  return (
    <div className="App">
      {!selectedRoomId ? (
        // Шаг 1: показываем список комнат
        <RoomList onSelectRoom={setSelectedRoomId} />
      ) : (
        // Шаг 2: показываем рабочую область выбранной комнаты
        <Canvas roomId={selectedRoomId} onBack={() => setSelectedRoomId(null)} />
      )}
    </div>
  );
}
