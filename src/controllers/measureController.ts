import { Request, Response } from "express";
import uploadImage from "../services/measureService";
import { InvalidDataError, MeasureAlreadyExistsError } from "../errors/measureError";

export async function uploadMeasure(request: Request, response: Response): Promise<void> {
    const { image, customer_code, measure_datetime, measure_type } = request.body;

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
        if (error instanceof InvalidDataError) {
            response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: error.message
            });
        } else if (error instanceof MeasureAlreadyExistsError) {
            response.status(409).json({
                error_code: "MEASURE_ALREADY_EXISTS",
                error_description: error.message
            });
        } else {
            console.error("Erro no uploadMeasure:", error);
            response.status(500).json({
                error_code: "UPLOAD_ERROR",
                error_description: "Erro inesperado ao processar a medição."
            });
        }
    }
}
