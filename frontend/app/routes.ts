import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./components/layout.tsx", [index("routes/budget.tsx")]),
] satisfies RouteConfig;
