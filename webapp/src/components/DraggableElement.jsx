// File: src/components/DraggableElement.jsx
import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableElement = ({ elem, onDrop }) => {
  const [ { isDragging }, dragRef ] = useDrag({
    type: 'ELEMENT',
    item: { id: elem.id, x: elem.x, y: elem.y },
    end: (item, monitor) => {
      const dropResult = monitor.getDifferenceFromInitialOffset();
      if (item && dropResult) {
        const newX = item.x + dropResult.x;
        const newY = item.y + dropResult.y;
        onDrop(item.id, newX, newY);
      }
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef}
      style={{
        position: 'absolute',
        left: `${elem.x}px`,
        top: `${elem.y}px`,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
    >
      🔘
    </div>
  );
};

export default DraggableElement;
