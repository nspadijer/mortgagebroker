import http from "node:http";
import ngrok from "@ngrok/ngrok";

const PORT = Number(process.env.PORT ?? 8080);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("Congrats you have created an ngrok web server");
});

server.listen(PORT, () => {
  console.log(`Node.js web server at ${PORT} is running...`);

  ngrok
    .connect({ addr: PORT, authtoken_from_env: true })
    .then((listener) => {
      console.log(`Ingress established at: ${listener.url()}`);
    })
    .catch((error) => {
      console.error("Failed to establish ngrok tunnel", error);
      process.exitCode = 1;
    });
});
