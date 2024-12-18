import { VTT } from "../classes/VTT";

export const renderPortals = (vtt: VTT) => {
  const { mapData } = vtt;
  if (!mapData || (mapData.portals?.length ?? 0) === 0) {
    return;
  }

  const ctx = vtt.ctx.background;

  ctx.save();

  ctx.strokeStyle = "lightblue";
  ctx.lineWidth = Math.max(1, Math.min(4, 4 / vtt.zoom));

  mapData.portals.forEach((portal) => {
    ctx.beginPath();
    portal.bounds.forEach((point, index) => {
      const x = point.x * vtt.gridSize.width + vtt.gridXOffset;
      const y = point.y * vtt.gridSize.height + vtt.gridYOffset;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  });

  ctx.restore();
};
