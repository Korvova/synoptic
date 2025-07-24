import React from 'react';
import { useDragLayer } from 'react-dnd';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1000,
};

function getItemStyles(initialOffset, clientOffset) {
  if (!initialOffset || !clientOffset) {
    return { display: 'none' };
  }
  const x = clientOffset.x - initialOffset.x;
  const y = clientOffset.y - initialOffset.y;
  return {
    transform: `translate(${initialOffset.x + x}px, ${initialOffset.y + y}px)`,
    WebkitTransform: `translate(${initialOffset.x + x}px, ${initialOffset.y + y}px)`,
  };
}

export default function CustomDragLayer({ typesMap }) {
  const {
    itemType,
    isDragging,
    item,
    initialClientOffset,
    clientOffset,
  } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialClientOffset: monitor.getInitialClientOffset(),
    clientOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || itemType !== 'ELEMENT') {
    return null;
  }

  const type = typesMap[item.typeId] || {};
let src = type.imgNoId;
if ((item.deviceId || item.userId) && type.imgWithId) src = type.imgWithId;
if (item.state === 'on' && type.imgOn) src = type.imgOn;
if (item.state === 'off' && type.imgOff) src = type.imgOff;
if (src) src = `/synoptic${src}`;  // ← добавлено

  const styles = getItemStyles(initialClientOffset, clientOffset);

  return (
    <div style={layerStyles}>
      <div style={styles}>
        <img
          src={src}
          alt=""
          style={{ width: '40px', height: '40px', opacity: 0.5 }}
        />
      </div>
    </div>
  );
}
