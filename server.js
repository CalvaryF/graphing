const http = require("http");
const WebSocket = require("ws");
const chokidar = require("chokidar");
const fs = require("fs");
const path = require("path");

// Static file server
const serveFile = (req, res) => {
  const filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("File not found");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    }
  });
};

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    serveFile(req, res);
  }
});

// WebSocket server for hot reload
const wss = new WebSocket.Server({ server });
wss.on("connection", (ws) => {
  console.log("Client connected");
});

// Watch files for changes
chokidar.watch(__dirname).on("change", (filePath) => {
  console.log(`File changed: ${filePath}`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("reload");
    }
  });
});

// Start the server
const PORT = 8080;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

