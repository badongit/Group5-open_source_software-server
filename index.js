if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const connectDb = require("./configs/database");
const chatServer = require("./socket/chatServer");
const redisClient = require("./configs/redis");
const cleanTempSchedule = require("./helpers/cleanTempSchedule");
const fileUpload = require("express-fileupload");

const app = express();
connectDb();
redisClient.connect();
cleanTempSchedule.start();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./public/tmp",
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
routes(app);

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});

chatServer.listen(server);

//handle unhandle promise rejection
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);

  //close server
  server.close(() => process.exit(1));
});
