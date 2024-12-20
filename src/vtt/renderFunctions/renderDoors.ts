import { VTT } from "../classes/VTT";

export const renderDoors = (vtt: VTT) => {
  const { mapData } = vtt;
  if (!mapData || (mapData.doors?.length ?? 0) === 0) {
    return;
  }

  const ctx = vtt.ctx.background;

  ctx.save();

  ctx.lineWidth = Math.max(1, Math.min(4, 4 / vtt.zoom));

  mapData.doors.forEach((door) => {
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
  });

  ctx.restore();
};
