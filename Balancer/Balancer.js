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

  boot () {
    const app = express();

    app.use(express.json());

    app.get('*', (req, res) => {
      handler(req, res, this);
    });

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

  stop () {
    this.server.close();
  }

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
        server = this.serverLoad.indexOf(Math.min(...this.serverLoad));

        this.serverLoad[server]++;

        break;

      case "dynamic":
      case "dynamicImmediate":
      case "dynamicHybrid":
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