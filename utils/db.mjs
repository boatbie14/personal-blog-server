import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
dotenv.config();

const connectionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

export default connectionPool;
