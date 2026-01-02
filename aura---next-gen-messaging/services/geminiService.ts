
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGeminiResponse(userPrompt: string, history: {role: 'user' | 'model', parts: {text: string}[]}[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: "You are Gemini Assistant, a helpful and friendly chatbot inside a messaging app. Keep your responses relatively concise, similar to how people chat on WhatsApp. Use emojis occasionally.",
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble thinking right now. Could you repeat that?";
  }
}
