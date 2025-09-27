import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Auth routes (no layout)
  route("/login", "./routes/login.tsx"),
  route("/register", "./routes/register.tsx"),

  // Protected routes (with layout)
  layout("./components/layout.tsx", [
    index("routes/budget.tsx"),
    route(
      "/accounts/:accountId/transactions",
      "./routes/accountTransactions.tsx"
    ),
  ]),
] satisfies RouteConfig;
