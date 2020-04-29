import axios from 'axios';

// Handle a new request from the balancer
const users = (req, res, server) => {
  // Add the request to the execution stack
  server.queue.push([req, res]);

  // If the balancer is requesting immediate stats, send them
  if (req.get("stats")) {
    notifyBalancer(server);
  }

  // If this server isn't already handling a request, start processing it
  if (!server.isProcessing) {
    process(server);
  }
};

// Begin execution on a request in the queue
const process = (server) => {
  server.isProcessing = true;

  // Grab the next request from the execution queue
  const conn = server.queue.shift();

  const req = conn[0];
  const res = conn[1];

  // Simulate computation time by setting a timeout
  setTimeout(() => {
    // Set some helpful load info and send arbitrary data
    res.set("serverload", server.queue.length * server.delay);
    res.send('test ' + server.port + ": " + server.delay);

    // If no more requests in the queue, stop execution, otherwise, recursively compute
    if (server.queue.length === 0) {
      server.isProcessing = false;
    } else {
      process(server);
    }
  }, server.delay);
};

// Sends a notification to the balancer of the current load information on this server
const notifyBalancer = (server) => {
  axios.post("http://localhost:3000/stats", {
    load: server.queue.length * server.delay,
    port: server.port
  });
};

export default users;