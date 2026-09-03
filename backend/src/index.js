const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { ensureSchema } = require("./db");
const photosRouter = require("./routes/photos");

const app = express();
app.disable("x-powered-by");
const port = Number(process.env.PORT || 3000);

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header are typically same-origin or non-browser clients.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/photos", photosRouter);

const staticDir = path.join(__dirname, "..", "public");
app.use(express.static(staticDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`photo-uploader backend listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database schema", err);
    process.exit(1);
  });

