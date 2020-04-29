import Server from "../Server/Server";
import Balancer from "../Balancer/Balancer";
import fs from 'fs';

import axios from 'axios';

// basic sleep function used to wait
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class Metrics {

  constructor () {
    this.metrics = {};
  }

  // Initialize the balancer and servers for the next test
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

  // Kill all the servers to avoid port use problems
  teardown () {
    for (let server in this.balancer.serverList) {
      this.balancer.serverList[server].stop();
    }

    this.balancer.stop();
  }

  // Record the stats from the recent test into this.metrics
  recordStats (type, stats) {
    this.metrics[type] = {
      total: stats[0],
      average: stats[1]
    };
  }

  /**
   * Sends a specified number of requests to the balancer and waits for the responses
   *
   * @param quantity the number of requests to send
   * @returns {Promise<any | never>} promise to await on
   */
  async sendRequests (quantity) {
    let received = 0;
    const start = new Date().getTime();
    const times = [];

    // Begin asynchronous sending of requests
    return new Promise(async function(done) {
      for (let i = 0; i < quantity; i++) {
        // push a new time to record the start of this request
        times.push(new Date().getTime());

        // Send a new request to the balancer
        axios.get("http://localhost:3000/users")
          .then(res => {  // After getting a response
            // Record the response time
            times[i] = (new Date().getTime()) - times[i];
            received++;

            // If we received the last request
            if (received === quantity) {
              // Record test end time
              const end = new Date().getTime();

              // compute average request time
              let average = 0;
              for (let j = 0; j < quantity; j++) {
                average += times[j];
              }

              const total = end - start;
              average = average / quantity;

              console.log("\n--- " + quantity + " requests completed in " + total + " milliseconds with an average time of " + average + " milliseconds ---\n");

              // resolve the promise and pass values onto the then section
              done([total, average]);
            }
          });

        // wait 25 milliseconds between request
        await sleep(25);
      }
    }).then((stats) => {
      this.teardown();
      return stats
    });
  }

  /**
   * Execute all of the different tests
   *
   * @param quantity the number of messages to send
   * @returns {Promise<void>}
   */
  async all (quantity) {
    await this.noBalancing(quantity);
    await this.sequential(quantity);
    await this.random(quantity);
    await this.smallestQueue(quantity);
    await this.dynamic(quantity);
    await this.dynamicImmediate(quantity);
    await this.dynamicHybrid(quantity);

    // Write the final metrics to a file
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