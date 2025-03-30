import type { Request, Response, NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
};

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
export const authenticate = auth({
  audience: "https://api.your-numbers.app",
  issuerBaseURL: `https://your-numbers.eu.auth0.com/`,
});

export const routerLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`${req.method} ${req.url}`);
  next();
};
