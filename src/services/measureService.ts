import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { callGeminiApi } from "./geminiService";
import { UploadImageDTO, UploadImageResponseDTO } from "../dtos/uploadImageDTO";
import Measure from "../Models/Measure";
import { InvalidDataError, MeasureAlreadyExistsError, GeminiApiError, MeasureNotFoundError } from "../errors/measureError";

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

export async function confirmMeasureService(measure_uuid: string, confirmed_value: number): Promise<void> {
    if (!measure_uuid || typeof measure_uuid !== "string" || confirmed_value === undefined || typeof confirmed_value !== "number" || !Number.isInteger(confirmed_value)) {
        throw new InvalidDataError();
    }

    const measure = await Measure.findOne({ measure_uuid });

    if (!measure) {
        throw new MeasureNotFoundError();
    }

    if ((measure as any).confirmed_value !== undefined) {
        throw new InvalidDataError("A leitura já foi confirmada anteriormente.");
    }

    (measure as any).confirmed_value = confirmed_value;
    await measure.save();
}

export async function listMeasuresService(customer_code: string, measure_type?: string) {
    let filter: any = { customer_code };

    if (measure_type) {
        const normalizedType = measure_type.toUpperCase();
        if (normalizedType !== "WATER" && normalizedType !== "GAS") {
            throw new InvalidDataError("Tipo de medição não permitida");
        }
        filter.measure_type = normalizedType;
    }

    const measures = await Measure.find(filter).lean();

    if (!measures || measures.length === 0) {
        const error: any = new Error("Nenhuma leitura encontrada");
        error.statusCode = 404;
        error.error_code = "MEASURES_NOT_FOUND";
        throw error;
    }

    return {
        customer_code,
        measures: measures.map(m => ({
            measure_uuid: m.measure_uuid,
            measure_datetime: m.measure_datetime,
            measure_type: m.measure_type,
            has_confirmed: m.has_confirmed ?? false,
            image_url: m.image_url
        }))
    };
}
