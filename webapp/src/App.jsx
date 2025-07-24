// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import RoomList from './components/RoomList';
import Canvas from './components/Canvas';
import TypeSettings from './components/TypeSettings';

export default function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  return (
    <div className="App" style={{ padding: '20px' }}>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/synoptic/">Комнаты</Link> |{' '}
        <Link to="/synoptic/settings/types">Настройка типов</Link>
      </nav>
      <Routes>
        <Route
          path="/synoptic/"
          element={
            selectedRoomId ? (
              <Navigate to={`/synoptic/rooms/${selectedRoomId}`} />
            ) : (
              <RoomList onSelectRoom={setSelectedRoomId} />
            )
          }
        />
        <Route
          path="/synoptic/rooms/:id"
          element={<CanvasWrapper onBack={() => setSelectedRoomId(null)} />}
        />
        <Route path="/synoptic/settings/types" element={<TypeSettings />} />
      </Routes>
    </div>
  );
}

function CanvasWrapper({ onBack }) {
  const { id } = useParams();
  return <Canvas roomId={Number(id)} onBack={onBack} />;
}
