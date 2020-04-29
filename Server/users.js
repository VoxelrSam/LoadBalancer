import axios from 'axios';

const users = (req, res, server) => {
  server.queue.push([req, res]);

  if (req.get("stats")) {
    notifyBalancer(server);
  }

  if (!server.isProcessing) {
    process(server);
  }
};

const process = (server) => {
  server.isProcessing = true;

  const conn = server.queue.shift();
  const req = conn[0];
  const res = conn[1];

  // Simulate computation time by setting a timeout
  setTimeout(() => {
    res.set("serverload", server.queue.length * server.delay);
    res.send('test ' + server.port + ": " + server.delay);

    if (server.queue.length === 0) {
      server.isProcessing = false;
    } else {
      process(server);
    }
  }, server.delay);
};

const notifyBalancer = (server) => {
  axios.post("http://localhost:3000/stats", {
    load: server.queue.length * server.delay,
    port: server.port
  });
};

export default users;