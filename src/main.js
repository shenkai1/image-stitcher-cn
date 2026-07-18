const fileInput = document.querySelector("#fileInput");
const dropzone = document.querySelector("#dropzone");
const thumbGrid = document.querySelector("#thumbGrid");
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const columnsInput = document.querySelector("#columns");
const gapInput = document.querySelector("#gap");
const radiusInput = document.querySelector("#radius");
const backgroundInput = document.querySelector("#background");
const downloadButton = document.querySelector("#download");
const canvasWrap = document.querySelector(".canvas-wrap");

const state = {
  images: []
};

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve({ file, image, url: reader.result });
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addFiles(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  const loaded = await Promise.all(imageFiles.map(readImage));
  state.images.push(...loaded);
  render();
}

function renderThumbs() {
  thumbGrid.innerHTML = "";
  state.images.forEach((item, index) => {
    const thumb = document.createElement("div");
    thumb.className = "thumb";

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.file.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.ariaLabel = `移除 ${item.file.name}`;
    remove.addEventListener("click", () => {
      state.images.splice(index, 1);
      render();
    });

    thumb.append(img, remove);
    thumbGrid.append(thumb);
  });
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCover(image, x, y, width, height, radius) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;

  ctx.save();
  roundedRect(x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
}

function drawCanvas() {
  const count = state.images.length;
  downloadButton.disabled = count === 0;
  canvasWrap.classList.toggle("has-images", count > 0);
  if (count === 0) return;

  const columns = Number(columnsInput.value);
  const gap = Number(gapInput.value);
  const radius = Number(radiusInput.value);
  const rows = Math.ceil(count / columns);
  const tile = 280;
  const outer = gap;

  canvas.width = columns * tile + (columns - 1) * gap + outer * 2;
  canvas.height = rows * tile + (rows - 1) * gap + outer * 2;

  ctx.fillStyle = backgroundInput.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  state.images.forEach(({ image }, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = outer + col * (tile + gap);
    const y = outer + row * (tile + gap);
    drawCover(image, x, y, tile, tile, radius);
  });
}

function render() {
  renderThumbs();
  drawCanvas();
}

fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files);
  fileInput.value = "";
});

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-over");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-over"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-over");
  addFiles(event.dataTransfer.files);
});

[columnsInput, gapInput, radiusInput, backgroundInput].forEach((input) => {
  input.addEventListener("input", drawCanvas);
});

downloadButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "拼接图片.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
