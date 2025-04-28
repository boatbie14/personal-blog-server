import express from "express";
import db from "../utils/db.mjs";

const categoryRouter = express.Router();

// Get All categories
categoryRouter.get("/", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM categories WHERE 1=1`);

    return res.status(200).json({
      category: result.rows,
    });
  } catch (error) {
    console.error("Error retrieving posts:", error);
    return res.status(500).json({ message: "Server could not read category because database connection" });
  }
});

// Create new category
categoryRouter.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    const result = await db.query(`INSERT INTO categories (name) VALUES ($1) RETURNING *`, [name]);

    return res.status(201).json({
      message: "Category created successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ message: "Server could not create category due to database error" });
  }
});

// Update category by ID
categoryRouter.put("/:catId", async (req, res) => {
  try {
    const catId = req.params.catId;
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    const result = await db.query(`UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`, [name, catId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Server could not update category due to database error" });
  }
});

// Delete category by ID
categoryRouter.delete("/:catId", async (req, res) => {
  try {
    const catId = req.params.catId;

    const result = await db.query(`DELETE FROM categories WHERE id = $1 RETURNING *`, [catId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category deleted successfully",
      deletedCategory: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Server could not delete category due to database error" });
  }
});

export default categoryRouter;
