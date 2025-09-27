import { env } from "bun";
import express from "express";
import session from "express-session";
import { errorHandler, routerLogger } from "./src/api/middlewares";
import { mainRouter } from "./src/api";
import cors from "cors";
import { config } from "./src/config";
import dotenv from "dotenv";
import passport from "./src/config/passport";

// Load environment variables
const envFile =
  process.env.NODE_ENV === "development" ? ".env.development" : ".env";
dotenv.config({ path: envFile });

const app = express();
const port = 8080;

app.use(
  cors({
    origin: config.env === "development" ? "http://localhost:5173" : "https://app.your-numbers.app",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-fallback-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.env === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(routerLogger);

app.use(mainRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
  console.log(env.NODE_ENV);
});
