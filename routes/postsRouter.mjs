import express from "express";
import db from "../utils/db.mjs";

const postRouter = express.Router();

// Create a new post
postRouter.post("/", async (req, res) => {
  try {
    const { title, image, category_id, description, content, status_id } = req.body;

    // Check if required fields are present
    if (!title || !image || !category_id || !description || !content || !status_id) {
      return res.status(400).json({
        message: "Server could not create post because there are missing data from client",
      });
    }

    // Insert new post into database
    const query = `
    INSERT INTO posts (title, image, category_id, description, date, content, status_id)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
    RETURNING *
  `;

    const values = [title, image, category_id, description, content, status_id];
    const result = await db.query(query, values);

    return res.status(201).json({
      message: "Created post sucessfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      message: "Server could not create post because database connection",
    });
  }
});

postRouter.get("/", async (req, res) => {
  try {
    return res.status(200).json({ message: "Connect.." });
  } catch (e) {
    return res.status(200).json({ message: "Can't connect" });
  }
});

export default postRouter;
