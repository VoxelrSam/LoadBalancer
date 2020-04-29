import axios from 'axios';
import stream from 'stream';

const handler = (req, res, balancer) => {
  const serverIndex = balancer.getServerIndex(balancer);
  const config = balancer.algorithm === "dynamicHybrid" || balancer.algorithm === "dynamicImmediate" ? {
    headers: {
      stats: true
    }
  } : undefined;

  axios.get('http://localhost:' + balancer.serverList[serverIndex].port + req.originalUrl, config)
    .then(response => {
      if (balancer.algorithm === "smallestQueue") {
        balancer.serverLoad[serverIndex]--;
      } else if (balancer.algorithm === "dynamic" || balancer.algorithm === "dynamicHybrid") {
        balancer.serverLoad[serverIndex] = response.headers['serverload'];
      }

      res.set(response.headers);
      res.status(response.status);
      res.send(response.data);
    })
    .catch(error => {
      const response = error.response;

      if (balancer.algorithm === "smallestQueue") {
        balancer.serverLoad[serverIndex]--;
      } else if (balancer.algorithm === "dynamic" || balancer.algorithm === "dynamicHybrid") {
        balancer.serverLoad[serverIndex] = response.headers['serverload'];
      }

      res.set(response.headers);
      res.status(response.status);
      res.send(response.data);
    });
};

export default handler;