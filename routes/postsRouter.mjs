import express from "express";
import db from "../utils/db.mjs";
import { validatePostData } from "../middlewares/validatePost.js";

const postRouter = express.Router();

// Get All Posts with pagination, filtering, and search
postRouter.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const keyword = req.query.keyword;

    const queryParams = [];
    let paramPosition = 1;

    // Base SELECT query
    let queryText = `
      SELECT 
        p.id, 
        p.image, 
        c.name AS category, 
        p.title, 
        p.description, 
        p.date, 
        p.content, 
        s.status, 
        COUNT(l.id) AS likes_count
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN statuses s ON p.status_id = s.id
      LEFT JOIN likes l ON p.id = l.post_id
      WHERE 1=1
    `;

    // Count query (for pagination)
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) AS count
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN statuses s ON p.status_id = s.id
      LEFT JOIN likes l ON p.id = l.post_id
      WHERE 1=1
    `;

    // Filter by category
    if (category) {
      queryText += ` AND c.name = $${paramPosition}`;
      countQuery += ` AND c.name = $${paramPosition}`;
      queryParams.push(category);
      paramPosition++;
    }

    // Filter by keyword
    if (keyword) {
      queryText += ` AND (p.title ILIKE $${paramPosition} OR p.description ILIKE $${paramPosition} OR p.content ILIKE $${paramPosition})`;
      countQuery += ` AND (p.title ILIKE $${paramPosition} OR p.description ILIKE $${paramPosition} OR p.content ILIKE $${paramPosition})`;
      queryParams.push(`%${keyword}%`);
      paramPosition++;
    }

    // Add GROUP BY before ORDER/LIMIT
    queryText += `
      GROUP BY p.id, c.name, s.status
      ORDER BY p.date DESC
      LIMIT $${paramPosition} OFFSET $${paramPosition + 1}
    `;
    queryParams.push(limit, offset);

    const result = await db.query(queryText, queryParams);
    const countResult = await db.query(countQuery, queryParams.slice(0, paramPosition - 1));

    const totalPosts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    return res.status(200).json({
      totalPosts,
      totalPages,
      currentPage: page,
      limit,
      posts: result.rows,
      nextPage: page < totalPages ? page + 1 : null,
    });
  } catch (error) {
    console.error("Error retrieving posts:", error);
    return res.status(500).json({ message: "Server could not read posts because database connection" });
  }
});

// Get Post by ID
postRouter.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    const query = `
      SELECT 
        p.id,
        p.image,
        c.name AS category,
        p.title,
        p.description,
        p.date,
        p.content,
        s.status,
        COUNT(l.id) AS likes_count
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN statuses s ON p.status_id = s.id
      LEFT JOIN likes l ON p.id = l.post_id
      WHERE p.id = $1
      GROUP BY p.id, c.name, s.status
    `;

    const result = await db.query(query, [postId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Server could not find a requested post" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error retrieving post:", error);
    return res.status(500).json({ message: "Server could not read post because database connection" });
  }
});

// Create a new post
postRouter.post("/", validatePostData, async (req, res) => {
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

// Update Post
postRouter.put("/:postId", validatePostData, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, image, category_id, description, content, status_id } = req.body;

    // Check if required fields are present
    if (!title || !image || !category_id || !description || !content || !status_id) {
      return res.status(400).json({
        message: "Server could not update post because there are missing data from client",
      });
    }

    // Check if post exists
    const checkPost = await db.query("SELECT id FROM posts WHERE id = $1", [postId]);
    if (checkPost.rows.length === 0) {
      return res.status(404).json({ message: "Server could not find a requested post to update" });
    }

    // Update post
    const result = await db.query(
      `UPDATE posts 
       SET title = $1, 
           image = $2, 
           category_id = $3, 
           description = $4, 
           content = $5, 
           status_id = $6, 
           date = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, image, category_id, description, content, status_id, postId]
    );

    return res.status(200).json({
      message: "Updated post successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server could not update post because database connection" });
  }
});

// Delete Post
postRouter.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const checkPost = await db.query("SELECT id FROM posts WHERE id = $1", [postId]);
    if (checkPost.rows.length === 0) {
      return res.status(404).json({ message: "Server could not find a requested post to delete" });
    }

    // Delete post
    await db.query("DELETE FROM posts WHERE id = $1", [postId]);

    return res.status(200).json({ message: "Deleted post successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server could not delete post because database connection" });
  }
});

export default postRouter;
