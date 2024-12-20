import { VTT } from "../classes/VTT";

export const renderWalls = (vtt: VTT) => {
  const { mapData, isDebug } = vtt;
  if (!isDebug || !mapData || (mapData.walls?.length ?? 0) === 0) {
    return;
  }

  const ctx = vtt.ctx.background;

  ctx.save();
  const lineWidth = Math.max(1, Math.min(4, 4 / vtt.zoom));
  ctx.strokeStyle = "orange";
  ctx.fillStyle = "orange";
  ctx.lineWidth = lineWidth;

  mapData.walls.forEach((wall) => {
    if (wall.blocksVision && wall.blocksMovement) {
      // Blocks vision and movement - this is a normal wall
      ctx.strokeStyle = "orange";
    } else if (wall.blocksVision) {
      // Blocks vision but not movement - this is a fake wall
      ctx.strokeStyle = "black";
    } else if (wall.blocksMovement) {
      // Blocks movement but not vision - this is a window or invisible wall
      ctx.strokeStyle = "lightblue";
    } else {
      // This should never happen
      ctx.strokeStyle = "black";
    }
    ctx.beginPath();
    ctx.moveTo(wall.start.x, wall.start.y);
    ctx.lineTo(wall.end.x, wall.end.y);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(wall.start.x, wall.start.y, lineWidth * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wall.end.x, wall.end.y, lineWidth * 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
};
