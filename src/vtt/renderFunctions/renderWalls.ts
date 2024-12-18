import { VTT } from "../classes/VTT";

const wallColors = [
  "green",
  "blue",
  "red",
  "yellow",
  "purple",
  "orange",
  "pink",
];

export const renderWalls = (vtt: VTT) => {
  const { mapData } = vtt;
  if (!mapData || (mapData.line_of_sight?.length ?? 0) === 0) {
    return;
  }

  const ctx = vtt.ctx.background;

  ctx.save();
  ctx.fillStyle = "green";
  ctx.strokeStyle = "black";
  ctx.lineWidth = Math.max(1, Math.min(4, 4 / vtt.zoom));

  mapData.line_of_sight.forEach((line, index) => {
    ctx.strokeStyle = wallColors[index % wallColors.length];
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

    ctx.stroke();
  });

  ctx.restore();
};
