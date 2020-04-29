import Balancer from '../Balancer/Balancer';
import Server from '../Server/Server';

const serverList = [];
const delayList = [250, 500, 100, 200, 700];

for (let i = 0; i < 5; i++) {
  const server = new Server(3001 + i, delayList[i]);
  serverList.push(server);
  server.boot();
}

const balancer = new Balancer(3000, serverList, "dynamicHybrid");
balancer.boot();