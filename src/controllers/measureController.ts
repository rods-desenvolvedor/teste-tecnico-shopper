import { Request, Response } from "express";
import uploadImage from "../services/measureService";
import { InvalidDataError, MeasureAlreadyExistsError, MeasureNotFoundError } from "../errors/measureError";
import { confirmMeasureService, listMeasuresService } from "../services/measureService";

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


export async function confirmMeasure(request: Request, response: Response): Promise<void>
{
    const { measure_uuid, confirmed_value } = request.body;

    if (!measure_uuid ||typeof measure_uuid !== "string" || confirmed_value === undefined ||
        typeof confirmed_value !== "number" ||
        !Number.isInteger(confirmed_value)) 
    {
        response.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Os dados fornecidos no corpo da requisição são inválidos."
        });
    }

    try {
        await confirmMeasureService(measure_uuid, confirmed_value);

        response.status(200).json({ success: true });
    } catch (error) {
        if (error instanceof InvalidDataError) {
            response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: error.message
            });
        }

        if (error instanceof MeasureNotFoundError) {
            response.status(404).json({
                error_code: "MEASURE_NOT_FOUND",
                error_description: "Leitura não encontrada."
            });
        }

        console.error("Erro no confirmMeasure:", error);
        
        response.status(500).json({
            error_code: "CONFIRM_ERROR",
            error_description: "Erro inesperado ao processar a confirmação."
        });
    }
};


export async function listMeasure(request: Request, response: Response): Promise<void> {
    const customer_code = request.params.customer_code;
    const measure_type = request.query.measure_type as string | undefined;

    try {
        const result = await listMeasuresService(customer_code, measure_type);
        response.status(200).json(result);

    } catch (error: any) {
        if (error instanceof InvalidDataError) {
            response.status(400).json({
                error_code: "INVALID_TYPE",
                error_description: error.message
            });
        }
        if (error.statusCode === 404) {
            response.status(404).json({
                error_code: "MEASURES_NOT_FOUND",
                error_description: error.message
            });
        }
        console.error("Erro no listMeasures:", error);
        response.status(500).json({
            error_code: "LIST_MEASURES_ERROR",
            error_description: "Erro inesperado ao listar as medições."
        });
    }
}



