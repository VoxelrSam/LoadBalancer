import Balancer from '../Balancer/Balancer';
import Server from '../Server/Server';

const serverList = [new Server(3001, 100)];
serverList[0].boot();

const balancer = new Balancer(3000, serverList);

balancer.boot();