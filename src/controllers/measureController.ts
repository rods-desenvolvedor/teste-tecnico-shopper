import { Request, Response } from "express";
import uploadImage from "../services/measureService";

export async function uploadMeasure(request: Request, response: Response): Promise<void> {
    const { image, customer_code, measure_datetime, measure_type } = request.body;

    if (!image || !customer_code || !measure_datetime || !measure_type) {
        response.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Os dados fornecidos no corpo da requisição são inválidos."
        });
        return;
    }

    if (!["WATER", "GAS"].includes(measure_type.toUpperCase())) {
        response.status(400).json({
            error_code: "INVALID_MEASURE_TYPE",
            error_description: "O tipo de medição deve ser 'WATER' ou 'GAS'."
        });
        return;
    }

    try {
        const { image_url, measure_value, measure_uuid } = await uploadImage({
            base64Image: image,
            customer_code,
            measure_datetime,
            measure_type
        });

        response.status(200).json({
            image_url,
            measure_value,
            measure_uuid
        });
    } catch (error) {
        console.error("Erro no uploadMeasure:", error);
        response.status(500).json({
            error_code: "UPLOAD_ERROR",
            error_description: (error as Error).message || "Erro inesperado ao processar a medição."
        });
    }
}
