// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import RoomList from './components/RoomList';
import Canvas from './components/Canvas';
import TypeSettings from './components/TypeSettings';

export default function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  return (
    <div className="App" style={{ padding: '20px' }}>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/">Комнаты</Link> |{' '}
        <Link to="/settings/types">Настройка типов</Link>
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            selectedRoomId ? (
              <Navigate to={`/rooms/${selectedRoomId}`} />
            ) : (
              <RoomList onSelectRoom={setSelectedRoomId} />
            )
          }
        />
        <Route
          path="/rooms/:id"
          element={<CanvasWrapper onBack={() => setSelectedRoomId(null)} />}
        />
        <Route path="/settings/types" element={<TypeSettings />} />
      </Routes>
    </div>
  );
}

// Обёртка для Canvas, чтобы читать id из URL
import { useParams } from 'react-router-dom';
function CanvasWrapper({ onBack }) {
  const { id } = useParams();
  return <Canvas roomId={Number(id)} onBack={onBack} />;
}
