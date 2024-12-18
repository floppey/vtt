import { VTT } from "../classes/VTT";

export const renderLineOfSightObjects = (vtt: VTT) => {
  const { mapData } = vtt;
  if (!mapData || (mapData.objects_line_of_sight?.length ?? 0) === 0) {
    return;
  }

  const ctx = vtt.ctx.background;

  ctx.save();
  ctx.fillStyle = "purple";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  mapData.objects_line_of_sight.forEach((line) => {
    ctx.beginPath();
    line.forEach((point, index) => {
      const x = point.x * vtt.gridSize.width + vtt.gridXOffset;
      const y = point.y * vtt.gridSize.height + vtt.gridYOffset;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
};
