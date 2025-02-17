require("dotenv").config();
const dotenv = require("dotenv");
const app = require("./app");
const http = require("http");
const connectDataBase = require("./src/config/db");

const server = http.createServer(app);
// Routes


dotenv.config();




// connect database here
connectDataBase();

const PORT = process.env.PORT || 5000;


server.listen(PORT, () => {
  console.log(`the server is running at port ${process.env.PORT}`);
}).on('error', (err) => {
  console.error(`Failed to start server: ${err.message}`);
});
 