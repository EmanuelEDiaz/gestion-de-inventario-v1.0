import { createSerwistRoute } from "@serwist/turbopack";

const revision = crypto.randomUUID();

const STATIC_PAGES = [
  "/", "/adjustments", "/audit-log", "/categories",
  "/currencies", "/customers", "/dashboard", "/debts",
  "/exchange-rates", "/export", "/import", "/login",
  "/movements", "/notifications", "/products", "/products/new",
  "/purchases", "/reports", "/returns", "/roles", "/sales",
  "/settings", "/stock", "/suppliers", "/sync/incidents",
  "/transfers", "/users", "/warehouses", "/warehouses/new",
] as const;

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/sw.ts",
    additionalPrecacheEntries: [
      ...STATIC_PAGES.map((url) => ({ url, revision })),
    ],
    useNativeEsbuild: true,
  });
