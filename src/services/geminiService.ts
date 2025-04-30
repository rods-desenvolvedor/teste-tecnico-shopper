import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import fs from "fs";

const AI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function callGeminiApi(filePath: string, aiPrompt: string): Promise<string> {

  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("Arquivo de imagem não encontrado ou caminho inválido.");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Chave da API do Gemini não encontrada. Verifique o .env.");
  }

  try {

    const uploadedFile = await AI.files.upload({
      file: filePath,
      config: { mimeType: "image/jpeg" },
    });

    if (!uploadedFile.uri || !uploadedFile.mimeType) {
      throw new Error("Erro ao obter URI ou MIME type do arquivo após o upload.");
    }

    const response = await AI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
        aiPrompt,
      ]),
    });

    if(!response.text)
    {
        throw new Error("Erro ao obter texto da API da gemini");
    }


    return response.text;

  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error);
    throw error;
  }
}

export default callGeminiApi;
