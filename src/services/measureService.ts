import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { callGeminiApi } from "./geminiService";
import { UploadImageDTO, UploadImageResponseDTO } from "../dtos/uploadImageDTO";
import Measure from "../Models/Measure";
import { InvalidDataError, MeasureAlreadyExistsError, GeminiApiError } from "../errors/measureError";

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
        throw new InvalidDataError();
    }

    if (!customer_code || typeof customer_code !== "string") {
        throw new InvalidDataError("O código do cliente é obrigatório.");
    }

    if (!measure_type || !["WATER", "GAS"].includes(measure_type)) {
        throw new InvalidDataError("O tipo de medição é obrigatório e deve ser 'WATER' ou 'GAS'.");
    }

    if (!measure_datetime || isNaN(new Date(measure_datetime).getTime())) {
        throw new InvalidDataError("A data da medição é obrigatória e deve ser uma data válida.");
    }

    try {
        await fs.promises.writeFile(tempPath, Buffer.from(base64Image, "base64"));

        const geminiResponse = await callGeminiApi(
            tempPath,
            "Analisar essa imagem (pode ser um medidor de água ou de gás) e retornar a medição, não precisa dos valores após vírgula"
        );

        const image_url = `http://localhost:3000/temp/${filename}`;
        const measure_uuid = uuidv4();
        const measure_value = parseInt(geminiResponse.replace(/\D/g, ""), 10);

        if (isNaN(measure_value)) {
            throw new InvalidDataError("Não foi possível interpretar um valor numérico válido da imagem.");
        }

        const existingMeasure = await Measure.findOne({
            customer_code,
            measure_type,
            measure_datetime: {
                $gte: new Date(new Date(measure_datetime).getFullYear(), new Date(measure_datetime).getMonth(), 1),
                $lt: new Date(new Date(measure_datetime).getFullYear(), new Date(measure_datetime).getMonth() + 1, 1)
            }
        });

        if (existingMeasure) {
            throw new MeasureAlreadyExistsError();
        }


        await Measure.create({
            customer_code,
            measure_type,
            measure_datetime,
            measure_value,
            measure_uuid,
            image_url
        });

        return {
            image_url,
            measure_value,
            measure_uuid
        };

    } catch (error) {
        console.error("Erro no uploadImage:", error);
        if (error instanceof InvalidDataError || error instanceof MeasureAlreadyExistsError) {
            throw error;
        }
        throw new GeminiApiError();
    }
}
