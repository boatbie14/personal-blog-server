import pg from "pg";
const { Pool } = pg;

const connectionPool = new Pool({
  connectionString: "postgresql://postgres:1234@localhost:5432/personal_blog",
});

export default connectionPool;
