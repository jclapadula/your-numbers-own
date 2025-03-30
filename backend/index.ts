import { env } from "bun";
import express from "express";
import { errorHandler, routerLogger } from "./src/api/middlewares";
import { mainRouter } from "./src/api";

const app = express();
const port = 8080;

app.use(mainRouter);

app.use(routerLogger);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
  console.log(env.NODE_ENV);
});
