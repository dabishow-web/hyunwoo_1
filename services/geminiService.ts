
import { GoogleGenAI, Type } from "@google/genai";

// Analyze receipt image using the recommended gemini-3-flash-preview model.
export const analyzeReceiptImage = async (base64Image: string): Promise<{ amount: number; description: string; date: string; categoryGuess: string }> => {
  try {
    // Initialize Gemini API client using the environment variable directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this receipt image. Extract the total amount, the date (ISO format YYYY-MM-DD), a short description (merchant name), and guess a generic category (e.g., Food, Transport, Shopping).",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            categoryGuess: { type: Type.STRING },
          },
          required: ["amount", "date", "description", "categoryGuess"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Ensure the response text is trimmed and parsed correctly.
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Receipt analysis failed:", error);
    throw error;
  }
};
