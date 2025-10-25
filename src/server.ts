import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // ✅ must run before anything else

import uploadRoute from "./routes/upload";

const app = express();
app.use(
    cors({
        origin: [
            "http://localhost:5173",  // if using Vite
            "http://localhost:3000",  // if using CRA
            "https://bank-parser-frontend.onrender.com",
        ],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(express.json());
app.use("/api", uploadRoute);

app.get("/", (_, res) => res.send("✅ Bank Parser backend is running!"));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
