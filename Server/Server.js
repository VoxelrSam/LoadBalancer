import http from 'http';
import express from 'express';

import users from './users';

class Server {

  constructor (port, delay) {
    this.port = port;
    this.queue = [];
    this.isProcessing = false;

    if (delay)
      this.delay = delay;
    else
      this.delay = 0;
  }

  /**
   * Initialize the server and begin listening for connections
   */
  boot () {
    const app = express();

    app.use(express.json());

    // Set up test route that uses the delay value specified in this server's constructor
    app.get('/users', (req, res) => {
      users(req, res, this);
    });

    // Serve all static files under ../public/
    app.use(express.static("public"));

    // Create a 404 handler
    app.use(function(req, res, next) {
      res.status(404);
      return res.send("404: Not found");
    });

    const port = this.port;
    app.set('port', port);

    this.server = http.createServer(app);

    const onListening = () => {
      const addr = this.server.address();
      const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
      console.log('Server with delay ' + this.delay + ' listening on ' + bind);
    };

    this.server.listen(port);
    this.server.on('listening', onListening);
  }

  /**
   * Kill the server
   */
  stop () {
    this.server.close();
  }
}

export default Server;