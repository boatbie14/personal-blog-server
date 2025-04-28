import express from "express";
import db from "../utils/db.mjs";

const authorRouter = express.Router();

// Get author info (always using id=1)
authorRouter.get("/", async (req, res) => {
  try {
    const result = await db.query(`SELECT id, username, email, name, bio, img_url FROM author WHERE id = 1`);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Author not found" });
    }

    return res.status(200).json({
      author: result.rows[0],
    });
  } catch (error) {
    console.error("Error retrieving author:", error);
    return res.status(500).json({ message: "Server could not read author data due to database error" });
  }
});

// Create new author
// Create new author
authorRouter.post("/", async (req, res) => {
  try {
    const { username, email, name, bio, img_url } = req.body;

    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required" });
    }

    // Check if username already exists
    const existingUser = await db.query(`SELECT id FROM author WHERE username = $1`, [username]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Create new author with empty password as placeholder
    const result = await db.query(
      `INSERT INTO author (username, email, name, bio, img_url, password) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING id, username, email, name, bio, img_url`,
      [username, email, name || null, bio || null, img_url || null, ""] // ส่ง empty string สำหรับ password
    );

    return res.status(201).json({
      message: "Author created successfully",
      author: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating author:", error);
    return res.status(500).json({ message: "Server could not create author due to database error" });
  }
});

// Update author info (always using id=1)
authorRouter.put("/", async (req, res) => {
  try {
    const { username, email, name, bio, img_url } = req.body;

    // Build dynamic query based on provided fields
    let updateFields = [];
    let queryParams = [];
    let paramCounter = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramCounter}`);
      queryParams.push(username);
      paramCounter++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCounter}`);
      queryParams.push(email);
      paramCounter++;
    }

    if (name !== undefined) {
      updateFields.push(`name = $${paramCounter}`);
      queryParams.push(name);
      paramCounter++;
    }

    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCounter}`);
      queryParams.push(bio);
      paramCounter++;
    }

    if (img_url !== undefined) {
      updateFields.push(`img_url = $${paramCounter}`);
      queryParams.push(img_url);
      paramCounter++;
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `
      UPDATE author 
      SET ${updateFields.join(", ")} 
      WHERE id = 1 
      RETURNING id, username, email, name, bio, img_url
    `;

    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Author not found" });
    }

    return res.status(200).json({
      message: "Author updated successfully",
      author: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating author:", error);
    return res.status(500).json({ message: "Server could not update author due to database error" });
  }
});

export default authorRouter;

