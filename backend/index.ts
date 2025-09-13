import { env } from "bun";
import express from "express";
import { errorHandler, routerLogger } from "./src/api/middlewares";
import { mainRouter } from "./src/api";
import cors from "cors";
import { config } from "./src/config";
import dotenv from "dotenv";

// Load environment variables
const envFile =
  process.env.NODE_ENV === "development" ? ".env.development" : ".env";
dotenv.config({ path: envFile });

const app = express();
const port = 8080;

app.use(
  cors({
    origin: config.env === "development" ? "*" : "https://app.your-numbers.app",
  })
);

app.use(routerLogger);

app.use(mainRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
  console.log(env.NODE_ENV);
});
