import Server from "../Server/Server";
import Balancer from "../Balancer/Balancer";
import fs from 'fs';

import axios from 'axios';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class Metrics {

  constructor () {
    this.metrics = {};
  }

  setup (type) {
    console.log("\n=== Beginning metrics gathering for '" + type + "' ===\n");

    const serverList = [];
    const delayList = [250, 500, 100, 200, 700];

    for (let i = 0; i < 5; i++) {
      const server = new Server(3001 + i, delayList[i]);
      serverList.push(server);
      server.boot();
    }

    this.balancer = new Balancer(3000, serverList, type);
    this.balancer.boot();
  }

  teardown () {
    for (let server in this.balancer.serverList) {
      this.balancer.serverList[server].stop();
    }

    this.balancer.stop();
  }

  recordStats (type, stats) {
    this.metrics[type] = {
      total: stats[0],
      average: stats[1]
    };
  }

  async sendRequests (quantity) {
    let received = 0;
    const start = new Date().getTime();
    const times = [];

    return new Promise(async function(done) {
      for (let i = 0; i < quantity; i++) {
        times.push(new Date().getTime());

        axios.get("http://localhost:3000/users")
          .then(res => {
            times[i] = (new Date().getTime()) - times[i];
            received++;

            if (received === quantity) {
              const end = new Date().getTime();

              // compute average request time
              let average = 0;
              for (let j = 0; j < quantity; j++) {
                average += times[j];
              }

              const total = end - start;
              average = average / quantity;

              console.log("\n--- " + quantity + " requests completed in " + total + " milliseconds with an average time of " + average + " milliseconds ---\n");
              done([total, average]);
            }
          });

        await sleep(25);
      }
    }).then((stats) => {
      this.teardown();
      return stats
    });
  }

  async all (quantity) {
    await this.noBalancing(quantity);
    await this.sequential(quantity);
    await this.random(quantity);
    await this.smallestQueue(quantity);
    await this.dynamic(quantity);
    await this.dynamicImmediate(quantity);
    await this.dynamicHybrid(quantity);

    fs.writeFile('metrics.json', JSON.stringify(this.metrics, null, 2), 'utf8', () => {
      console.log("Metrics written to metrics.json");
    });
  }

  async noBalancing (quantity) {
    this.setup('noBalancing');

    this.recordStats('noBalancing', await this.sendRequests(quantity));
  }

  async sequential (quantity) {
    this.setup('sequential');

    this.recordStats('sequential', await this.sendRequests(quantity));
  }

  async random (quantity) {
    this.setup('random');

    this.recordStats('random', await this.sendRequests(quantity));
  }

  async smallestQueue (quantity) {
    this.setup('smallestQueue');

    this.recordStats('smallestQueue', await this.sendRequests(quantity));
  }

  async dynamic (quantity) {
    this.setup('dynamic');

    this.recordStats('dynamic', await this.sendRequests(quantity));
  }

  async dynamicImmediate (quantity) {
    this.setup('dynamicImmediate');

    this.recordStats('dynamicImmediate', await this.sendRequests(quantity));
  }

  async dynamicHybrid (quantity) {
    this.setup('dynamicHybrid');

    this.recordStats('dynamicHybrid', await this.sendRequests(quantity));
  }
}

export default Metrics;