
import { GoogleGenAI } from "@google/genai";

// Generate a secret message prompt using Gemini
export const generateSecretPrompt = async (theme: string): Promise<string> => {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, cool secret agent style message about: ${theme}. Keep it under 50 characters.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 60
      }
    });
    // Use the .text property directly as per guidelines
    return response.text || "Mission Alpha: Proceed to sector 7.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Protocol error. Use default transmission.";
  }
};

// Analyze the patterns in the symbolic text using Gemini
export const analyzeCipher = async (text: string): Promise<string> => {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Briefly analyze the visual patterns in this symbolic text: "${text}". What does it resemble (e.g., matrix, alien code, hieroglyphs)?`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100
      }
    });
    // Use the .text property directly as per guidelines
    return response.text || "Analysis complete.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "System failure during analysis.";
  }
};
