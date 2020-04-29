import http from 'http';
import express from 'express';

import handler from './handler';

class Balancer {

  constructor (port, serverList, algorithm) {
    this.port = port;
    this.serverList = serverList;
    this.serverLoad = Array(serverList.length).fill(0);
    this.algorithm = algorithm;
    this.currentServer = 0;
  }

  /**
   * Initialize the server for the load balancer and begin listening for connections
   */
  boot () {
    const app = express();

    app.use(express.json());

    // Set a catch all handler
    app.get('*', (req, res) => {
      handler(req, res, this);
    });

    // Create a route for load stats to be sent to from servers
    app.post('/stats', (req, res) => {
      let server;
      for (server in this.serverList) {
        if (this.serverList[server].port === req.body.port)
          break;
      }

      this.serverLoad[server] = req.body.load;

      res.send("thanks <3");
    });

    const port = this.port;
    app.set('port', port);

    this.server = http.createServer(app);

    const onListening = () => {
      const addr = this.server.address();
      const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
      console.log('Balancer listening on ' + bind);
    };

    this.server.listen(port);
    this.server.on('listening', onListening);
  }

  /**
   * Kills the load balancer
   */
  stop () {
    this.server.close();
  }

  /**
   * Use the balancer's algorithm to determine which server to send the next request to
   *
   * @returns index number for the chosen server in this.serverList
   */
  getServerIndex () {
    let server;

    switch (this.algorithm) {
      case "sequential":
        server = this.currentServer;

        this.currentServer++;
        this.currentServer = this.currentServer % this.serverList.length;

        break;

      case "random":
        server = Math.floor(Math.random() * this.serverList.length);

        break;

      case "smallestQueue":
        // Get the index of the server with the least connections
        server = this.serverLoad.indexOf(Math.min(...this.serverLoad));

        this.serverLoad[server]++;

        break;

      case "dynamic":
      case "dynamicImmediate":
      case "dynamicHybrid":
        // Get the index of the server with the least load
        for (let index in this.serverLoad) {
          if (!server || this.serverLoad[server] > this.serverLoad[index]) {
            server = index;
          }
        }

        break;

      default:
        server = 0;
    }

    return server;
  };
}

export default Balancer;