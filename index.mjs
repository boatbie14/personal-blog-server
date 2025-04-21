import express from "express";
import cors from "cors";
import postRouter from "./routes/postsRouter.mjs";

const app = express();
const port = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/posts", postRouter);

// Get profile data
app.get("/profiles", (req, res) => {
  try {
    const profileData = {
      data: {
        name: "john",
        age: 20,
      },
    };
    res.status(200).json(profileData);
  } catch (e) {
    return res.status(500).json({ message: "Can't connect server" });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// Not found route
app.use((req, res) => {
  res.status(404).send("Not found...");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
