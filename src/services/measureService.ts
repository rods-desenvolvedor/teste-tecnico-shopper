import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import callGeminiApi from "./geminiService";
import { UploadImageDTO, UploadImageResponseDTO } from "../dtos/uploadImageDTO";

export default async function uploadImage({
    base64Image,
    customer_code,
    measure_datetime,
    measure_type
}: UploadImageDTO): Promise<UploadImageResponseDTO> {

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

        // await fs.promises.unlink(tempPath);

        const image_url = `http://localhost:3000/temp/${filename}`;
        const measure_uuid = uuidv4();
        const measure_value = parseInt(geminiResponse.replace(/\D/g, ""), 10);

        if (isNaN(measure_value)) {
            throw new Error("Não foi possível interpretar um valor numérico válido da imagem.");
        }

        return {
            image_url,
            measure_value,
            measure_uuid
        };

    } catch (error) {
        console.error("Erro no uploadImage:", error);
        throw new Error("Falha ao processar a imagem ou chamar a API do Gemini.");
    }
}
