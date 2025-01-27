//TODO!! fix axis / function numebers not lining up with axes

function setupCanvas(canvasId, rows, cols, padding = 30) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false; // Disable anti-aliasing
  canvas.style.cursor = "none";

  const cellSize = Math.floor(
    Math.min(
      (window.innerWidth - padding * 2) / cols,
      (window.innerHeight - padding * 2) / rows
    )
  );

  canvas.width = cellSize * cols;
  canvas.height = cellSize * rows;

  return { canvas, ctx, cellSize };
}

function lightenColor(color, alpha) {
  const num = parseInt(color.slice(1), 16);
  const R = (num >> 16) & 0xff;
  const G = (num >> 8) & 0xff;
  const B = num & 0xff;
  return `rgba(${R}, ${G}, ${B}, ${alpha / 100})`;
}

function drawCellArrays(canvasId, cellArrays, rows, cols) {
  console.log(rows);
  console.log(cols);
  const { canvas, ctx, cellSize } = setupCanvas(canvasId, rows, cols);

  const centerX = Math.floor(cols / 2);
  const centerY = Math.floor(rows / 2);

  const filledCellArrays = cellArrays.map((cellArray) => ({
    ...cellArray,
    data: cellArray.data,
    renderData: cellArray.data.map(([x, y]) => [x + centerX, -y + centerY]),
  }));

  function drawCellsFromArrays() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    filledCellArrays.forEach((cellArray) => {
      fillBetweenPixels(cellArray.renderData).forEach(([x, y]) => {
        ctx.fillStyle = lightenColor(cellArray.color || "#000", 60);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      });
    });
    filledCellArrays.forEach((cellArray) => {
      cellArray.renderData.forEach(([x, y]) => {
        ctx.fillStyle = cellArray.color || "#000";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      });
    });
  }

  drawCellsFromArrays();

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const colIndex = Math.floor(x / cellSize);
    const rowIndex = Math.floor(y / cellSize);
    drawCellsFromArrays();
    hideTooltip();
    filledCellArrays.forEach((cellArray) => {
      if (cellArray.selectable) {
        const isHovered = fillBetweenPixels(cellArray.renderData).some(
          ([cx, cy]) =>
            Math.abs(cx - colIndex) <= 1 && Math.abs(cy - rowIndex) <= 1
        );
        if (isHovered) {
          const cellDataIndex = cellArray.renderData.findIndex(
            ([cx, cy]) =>
              Math.abs(cx - colIndex) <= 0 && Math.abs(cy - rowIndex) <= 0
          );
          const cellData = cellArray.data[cellDataIndex];
          if (cellData) {
            showTooltip(event.clientX, event.clientY, `${cellData}`);
          }
          //  ctx.clearRect(0, 0, canvas.width, canvas.height);
          fillBetweenPixels(cellArray.renderData).forEach(([x, y]) => {
            ctx.fillStyle = "#fff";
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          });
          fillBetweenPixels(cellArray.renderData).forEach(([x, y]) => {
            ctx.fillStyle = lightenColor("#00aaff", 70);
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          });

          cellArray.renderData.forEach(([x, y]) => {
            ctx.fillStyle = "#00aaff"; // Red color
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          });
        }
      }
      ctx.fillStyle = "#0000FF";
      ctx.fillRect(
        colIndex * cellSize,
        rowIndex * cellSize,
        cellSize,
        cellSize
      );
    });
  });
}

function showTooltip(x, y, color) {
  let tooltip = document.getElementById("tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.backgroundColor = "rgba(255, 255, 255, 0.5)"; // Transparent background
    tooltip.style.padding = "10px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.fontFamily = "monospace";
    tooltip.style.fontSize = "16px";
    tooltip.style.fontWeight = "600";
    document.body.appendChild(tooltip);
  }
  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${y + 10}px`;
  tooltip.textContent = color;
  tooltip.style.display = "block";
}

function hideTooltip() {
  const tooltip = document.getElementById("tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function fillBetweenPixels(pixels) {
  const pixelsCopy = [...pixels];
  const result = [...pixels];
  for (let i = 0; i < pixelsCopy.length - 1; i++) {
    const [startX, startY] = pixelsCopy[i];
    const [endX, endY] = pixelsCopy[i + 1];

    const step = Math.sign(startY - endY);
    for (let y = endY + step; y !== startY; y += step) {
      result.push([endX, y]);
    }
  }
  return result;
}

function generateAxesCellArray(rows, cols, color) {
  const centerX = Math.floor(cols / 2);
  const centerY = Math.floor(rows / 2);

  const data = [];

  for (let x = -centerX; x < centerX; x++) {
    data.push([x, 0]); // x-axis
  }

  for (let y = -centerY; y < centerY; y++) {
    data.push([0, y]); // y-axis
  }

  return { id: "axes", data, color, selectable: false };
}

function x(rows, cols) {
  const centerY = Math.floor(rows / 2);
  const centerX = Math.floor(cols / 2); // Calculate centerX
  const data = [];

  for (let x = -centerX; x < centerX; x++) {
    // Adjust x range
    data.push([x, 0]); // Center y at 0
  }

  return data;
}

//numeric functions

function applyPower(pixels, exponent) {
  const result = pixels.map(([x, y]) => [x, Math.round(Math.pow(x, exponent))]);
  return result;
}

function multiply(pixels, scalar) {
  const result = pixels.map(([x, y]) => [x, Math.round(y * scalar)]);
  return result;
}

function applySine(pixels, amplitude, frequency) {
  return pixels.map(([x, y]) => {
    const sineOffset = Math.round(amplitude * Math.sin(frequency * x));
    return [x, y + sineOffset];
  });
}

function add(array1, array2) {
  const result = [];
  const length = Math.min(array1.length, array2.length);
  for (let i = 0; i < length; i++) {
    const [x1, y1] = array1[i];
    const [x2, y2] = array2[i];
    result.push([x1, y1 + y2]);
  }
  return result;
}

// Calling
//make sure this is all functional

const rows = 100;
const cols = 200;
const axes = generateAxesCellArray(rows, cols, "#eeeeffaa");

const sins1 = {
  data: add(
    applySine(x(rows, cols), 10, 0.3),
    applySine(x(rows, cols), 20, 0.09)
  ),
  id: "xaxis",
  color: "#333",
  selectable: true,
};

const pow1 = {
  data: multiply(applyPower(x(rows, cols), 2), 0.05),
  id: "pow",
  color: "#aabbcc",
  selectable: true,
};

drawCellArrays("myCanvas", [axes, sins1, pow1], rows, cols);
