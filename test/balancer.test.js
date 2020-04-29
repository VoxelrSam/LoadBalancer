import {expect} from 'chai';
import axios from 'axios';
import chai from 'chai';

const should = chai.should();

import Balancer from '../Balancer/Balancer';
import Server from '../Server/Server';

let balancer;

describe("* Load Balancer Tests", () => {
  before(() => {
    //console.log("Beginning balancer tests");
    const serverList = [];

    for (let i = 0; i < 5; i++) {
      const server = new Server(3001 + i, 100);
      serverList.push(server);
      server.boot();
    }

    balancer = new Balancer(3000, serverList);
    balancer.boot();
  });

  after(() => {
    for (let server in balancer.serverList) {
      balancer.serverList[server].stop();
    }

    balancer.stop();
  });

  describe("* Sanity Tests", () => {
    it("Should get a valid response from a server via the balancer", (done) => {
      axios.get("http://localhost:3000/users")
        .then(res => {
          res.data.should.equal('banana 3000\ntest 100');
        }).then(done, done);
    });
  });
});