// File: src/components/DraggableElement.jsx
import React, { useRef, useEffect, useState } from 'react';

const DraggableElement = ({ elem, onDrop, children }) => {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: elem.x, y: elem.y });

  useEffect(() => {
    // если координаты в props меняются (после сохранения), синхронизируем
    setPos({ x: elem.x, y: elem.y });
  }, [elem.x, elem.y]);

  useEffect(() => {
    const onMouseMove = e => {
      if (!dragging) return;
      // рассчитываем новые координаты относительно контейнера
      const rect = ref.current.parentElement.getBoundingClientRect();
      const newX = e.clientX - rect.left - offset.current.x;
      const newY = e.clientY - rect.top  - offset.current.y;
      setPos({ x: newX, y: newY });
    };
    const onMouseUp = e => {
      if (dragging) {
        setDragging(false);
        onDrop(elem.id, pos.x, pos.y);
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    };
  }, [dragging, pos]);

  // смещение курсора внутри элемента при начале drag
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = e => {
    e.stopPropagation();
    const rect = ref.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDragging(true);
  };

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
};

export default DraggableElement;
