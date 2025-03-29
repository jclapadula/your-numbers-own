import { env } from "bun";
import express from "express";
import { errorHandler } from "./src/api/middlewares";
import { usersRouter } from "./src/api/usersRouter";

const app = express();
const port = 8080;

app.get("/", (req, res) => {
  res.status(200).send("");
});

app.use("/api/users", usersRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
  console.log(env.NODE_ENV);
});
