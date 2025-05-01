import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import callGeminiApi from "./geminiService";

export default async function uploadImage(base64Image: string,customer_code: string,
    measure_datetime: string,
    measure_type: string): Promise<string> 
{
    const tempDir = path.resolve(__dirname, "../../temp");

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const filename = `${uuidv4()}.jpg`;
    const tempPath = path.resolve(tempDir, filename);

    if (!base64Image || typeof base64Image !== "string") {
        throw new Error("Imagem em base64 inválida.");
    }

    try {
        await fs.promises.writeFile(tempPath, Buffer.from(base64Image, "base64"));

        const geminiResponse = await callGeminiApi(
            tempPath,
            "Analisar essa imagem (pode ser um medidor de água ou de gás) e retornar a medição, não precisa dos valores após vírgula"
        );

        // Limpa a pasta temp/
        // Durante os testes, muitas imagens estavam se acumulando em temp/
        // (talvez retirar em versões futuras)
        await fs.promises.unlink(tempPath); 

        return geminiResponse;

    } catch (error) {
        console.error("Erro no uploadImage:", error);
        throw new Error("Falha ao processar a imagem ou chamar a API do Gemini.");
    }
}
