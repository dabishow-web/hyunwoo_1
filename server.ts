import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    // If no key is set, the SDK may still authenticate automatically in the AI Studio environment
    genAI = new GoogleGenerativeAI(apiKey || "");
  }
  return genAI;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for Gemini API
  app.post("/api/gemini", async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      const ai = getGeminiClient();
      const generativeModel = ai.getGenerativeModel({ model: model || "gemini-1.5-flash" });
      
      const result = await generativeModel.generateContent({
        contents: contents,
        generationConfig: config,
      });
      
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("[Proxy] Gemini error:", error);
      res.status(500).json({ error: error.message || "Failed to call Gemini" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
