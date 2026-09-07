const express = require("express");
const multer = require("multer");
const { pool } = require("../db");
const { uploadImage } = require("../s3");

const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Allow room for multipart boundaries, headers, and the description without
// rejecting a valid request before multer can enforce the file-size limit.
const MAX_CONTENT_LENGTH = MAX_FILE_SIZE + 1 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    fieldSize: 100 * 1024,
    fields: 1,
    files: 1,
  },
});

const router = express.Router();

function enforceContentLength(req, res, next) {
  const contentLength = Number(req.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > MAX_CONTENT_LENGTH) {
    return res.status(413).json({ error: "Request payload is too large." });
  }
  next();
}

function toPhotoResponse(row) {
  const domain = process.env.CLOUDFRONT_DOMAIN;
  return {
    id: row.id,
    description: row.description,
    url: `https://${domain}/${row.object_key}`,
    createdAt: row.created_at,
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, description, object_key, created_at FROM photos ORDER BY created_at DESC",
    );
    res.json(result.rows.map(toPhotoResponse));
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  enforceContentLength,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "An image file is required." });
      }
      const description = (req.body.description || "").trim();
      if (!description) {
        return res.status(400).json({ error: "A description is required." });
      }

      const objectKey = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      );
      const result = await pool.query(
        "INSERT INTO photos (description, object_key) VALUES ($1, $2) RETURNING id, description, object_key, created_at",
        [description, objectKey],
      );
      res.status(201).json(toPhotoResponse(result.rows[0]));
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;

