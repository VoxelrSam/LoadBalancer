import axios from 'axios';

const handler = (req, res, balancer) => {
  // Get the index for the next server
  const serverIndex = balancer.getServerIndex();

  // If our balancer algorithm wants load stats from the server, set the header to indicate so
  const config = balancer.algorithm === "dynamicHybrid" || balancer.algorithm === "dynamicImmediate" ? {
    headers: {
      stats: true
    }
  } : undefined;

  // Forward the request on to the server found earlier
  axios.get('http://localhost:' + balancer.serverList[serverIndex].port + req.originalUrl, config)
    .then(response => {
      // Update the server load information if necessary
      if (balancer.algorithm === "smallestQueue") {
        balancer.serverLoad[serverIndex]--;
      } else if (balancer.algorithm === "dynamic" || balancer.algorithm === "dynamicHybrid") {
        balancer.serverLoad[serverIndex] = response.headers['serverload'];
      }

      // Forward the response back to the client
      res.set(response.headers);
      res.status(response.status);
      res.send(response.data);
    })
    .catch(error => {
      // We probably got to here from a 404 from the server. In normal testing through Metrics.js, we should not need
      // this handler. For the sake of having normal browsing, we will have this handler behave the same as above

      const response = error.response;

      // Update the server load information if necessary
      if (balancer.algorithm === "smallestQueue") {
        balancer.serverLoad[serverIndex]--;
      } else if (balancer.algorithm === "dynamic" || balancer.algorithm === "dynamicHybrid") {
        balancer.serverLoad[serverIndex] = response.headers['serverload'];
      }

      // Forward the response back to the client
      res.set(response.headers);
      res.status(response.status);
      res.send(response.data);
    });
};

export default handler;