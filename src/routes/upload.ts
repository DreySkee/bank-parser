import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import { convertToCSV } from "../utils/convertToCSV";

const router = express.Router();
const upload = multer({ dest: "tmp/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded.");

    console.log(`📄 Uploaded file: ${req.file.originalname} (${req.file.mimetype})`);

    // ✅ Step 1: Ensure correct extension for tmp file
    const extension =
      path.extname(req.file.originalname) || `.${mime.extension(req.file.mimetype) || "pdf"}`;
    const renamedPath = path.join("tmp", req.file.filename + extension);
    fs.renameSync(req.file.path, renamedPath);
    console.log(`📦 Renamed file for upload: ${renamedPath}`);

    // ✅ Step 2: Upload the file to OpenAI (purpose: assistants)
    const uploadedFile = await openai.files.create({
      file: fs.createReadStream(renamedPath),
      purpose: "assistants", // <-- correct and supported
    });
    console.log(`✅ Uploaded to OpenAI: ${uploadedFile.id}`);

    // ✅ Step 3: Create a response with file reference
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are a financial data parser. Output ONLY valid JSON, no explanations. Return a JSON array with fields: date, description, amount, type, transaction category",
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Extract transactions from this file." },
            { type: "input_file", file_id: uploadedFile.id },
          ],
        },
      ],
    });

    console.log("✅ Response received from OpenAI");

    // ✅ Step 4: Parse JSON and convert to CSV
    let parsed: any[] = [];
    try {
      let text = response.output_text || "[]";

      // ✅ Clean up markdown fences and stray characters
      text = text
        .trim()
        .replace(/^```(json)?/i, "") // remove leading ```json
        .replace(/```$/, "") // remove trailing ```
        .replace(/[\r\n]+/g, " ") // normalize newlines
        .trim();

      let json: any;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.warn("⚠️ Initial parse failed, attempting to extract JSON block...");
        const match = text.match(/\[.*\]|\{.*\}/s);
        json = match ? JSON.parse(match[0]) : [];
      }

      parsed = Array.isArray(json) ? json : json.data || [];
    } catch (err) {
      console.error("⚠️ Failed to parse JSON:", err);
      parsed = [];
    }

    const csv = convertToCSV(parsed);
    res.header("Content-Type", "text/csv");
    res.attachment("transactions.csv");
    res.send(csv);

    // ✅ Step 5: Clean up
    fs.unlink(renamedPath, () => {});
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({
      error: "Failed to process file.",
      details: (err as Error).message,
    });
  }
});

export default router;
