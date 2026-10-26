import express, { type ErrorRequestHandler } from "express";
import { APP_NAME } from "@policia/shared";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "6mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: APP_NAME });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(
    "Unhandled API error:",
    error instanceof Error ? error.message : "unknown error",
  );
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);
