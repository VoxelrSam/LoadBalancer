# LoadBalancer
A simple load balancer for CS422

### Setup
This project uses [Nodejs](https://nodejs.org/en/). Be sure to install it before proceeding.

Next, while in the root of the project, be sure to install the dependancies using `npm install`

### Running the Project
After installing dependancies, you can use `npm start` to run the balancer using the dynamicHybrid algorithm with 5 servers.
A basic test file should then be accessible at http://localhost:3000/. To kill the program, just use ctrl + c.

To run the metrics gathering code, use `npm run metrics`. This should run through a series different balancing algorithms that handle 100 messages each.
If desired, you can change the number of messages sent in metrics/driver.js. To edit other values like the delay, refer to the code in metrics/Metrics.js.

After completing, these series of tests should dump their results into metrics.json

### Code Structure
If you are interested to know how the code works, I'd suggest looking at Balancer/Balancer.js and Server/Server.js mainly. 
The basic `npm start` command initializes and runs these files through bin/driver.js. 
All of the incoming requests for the balancer are handled in Balancer/handler.js, and the test route used to simulate delay on the server side is handled through Server/users.js.
