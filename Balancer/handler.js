import axios from 'axios';

const handler = (req, res, balancer) => {
  const serverIndex = balancer.getServerIndex(balancer);
  const config = balancer.algorithm === "dynamicImmediate" ? {
    headers: {
      stats: true
    }
  } : undefined;

  axios.get('http://localhost:' + balancer.serverList[serverIndex].port + req.originalUrl, config)
    .then(response => {
      if (balancer.algorithm === "smallestQueue") {
        balancer.serverLoad[serverIndex]--;
      } else if (balancer.algorithm === "dynamic" || balancer.algorithm === "dynamicImmediate") {
        balancer.serverLoad[serverIndex] = response.headers['serverload'];
      }

      res.send('banana ' + balancer.port + ' - ' + response.data);
    });
};

export default handler;