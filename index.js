require("dotenv").config();
const dotenv = require("dotenv");
const app = require("./app");
const http = require("http");
const ConnectDataBase = require("./src/config/db");

const server = http.createServer(app);
// Routes


dotenv.config();




// connect database here
ConnectDataBase();

const PORT = process.env.PORT || 5000;


server.listen(PORT, () => {
  console.log(`the server is running at port ${process.env.PORT}`);
}).on('error', (err) => {
  console.error(`Failed to start server: ${err.message}`);
});


// CLOUD_NAME =dqzb4ltbm ; //dg9kok5c0
// CLOUDINARY_API_KEY = 474852615849796; 461129199678296  // 
// CLOUDINARY_API_SECRET =bjYDET9EgpaKpWzji_Vlmk2f6TA;// xWLGQ8GaFarx0PjS1BUeLJ_5KRE