import { VTT } from "../classes/VTT";

export const renderDoors = (vtt: VTT) => {
  const { mapData, isDebug } = vtt;
  if (!mapData || (mapData.doors?.length ?? 0) === 0) {
    return;
  }

  const ctx = vtt.ctx.background;

  ctx.save();

  ctx.lineWidth = Math.max(1, Math.min(4, 4 / vtt.zoom));

  mapData.doors.forEach((door) => {
    if (isDebug) {
      if (door.isOpen) {
        ctx.strokeStyle = "lightgreen";
      } else if (door.isLocked) {
        ctx.strokeStyle = "red";
      } else if (door.blocksVision) {
        ctx.strokeStyle = "black";
      } else {
        ctx.strokeStyle = "lightblue";
      }
      ctx.beginPath();
      ctx.moveTo(door.start.x, door.start.y);
      ctx.lineTo(door.end.x, door.end.y);
      ctx.closePath();
      ctx.stroke();
    }

    // Draw door icon at the center of the door
    const doorCenter = {
      x: (door.start.x + door.end.x) / 2,
      y: (door.start.y + door.end.y) / 2,
    };
    const iconSize = vtt.gridSize.width / 8;
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(doorCenter.x, doorCenter.y, iconSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
};
