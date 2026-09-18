"use strict";
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path"),
  { spawn } = require("node:child_process");
const allowed = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/style.css", "style.css"],
  ["/app.js", "app.js"],
  ["/data.js", "data.js"],
]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};
const server = http.createServer((req, res) => {
  const file = allowed.get(new URL(req.url, "http://127.0.0.1").pathname);
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405).end();
    return;
  }
  fs.readFile(path.join(__dirname, file), (error, data) => {
    if (error) {
      res.writeHead(500).end("Extraia toda a pasta novamente.");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)],
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  });
});
server.on("error", (e) => {
  console.error("Erro ao iniciar: " + e.message);
  process.exitCode = 1;
});
server.listen(0, "127.0.0.1", () => {
  const url = "http://127.0.0.1:" + server.address().port + "/";
  console.log(
    "EcoCuritiba: " +
      url +
      "\nMantenha este terminal aberto. Para encerrar, pressione Ctrl+C.",
  );
  if (!process.argv.includes("--no-open")) {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-Command", `Start-Process '${url}'`],
      { windowsHide: true, stdio: "ignore" },
    );
    child.on("error", () => console.log("Abra o endereco acima no navegador."));
  }
});
