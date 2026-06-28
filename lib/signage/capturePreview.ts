/** Canvas-based preview capture without external dependencies. */
export async function captureSignagePreview(container: HTMLElement): Promise<Blob> {
  const rect = container.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);

  const canvas = document.createElement("canvas");
  canvas.width = w * 2;
  canvas.height = h * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.scale(2, 2);

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;background:#060608">
          ${container.innerHTML}
        </div>
      </foreignObject>
    </svg>`;

  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
        "image/png"
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Export failed"));
    };
    img.src = url;
  });
}
