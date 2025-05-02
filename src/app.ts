    import express from "express";
    import callGeminiApi from "./services/geminiService";
    import path from "path";
    import { Request, Response } from "express";
    import uploadImage from "./services/measureService";

    const app = express();

    app.use(express.json());

    app.get("/", async (request, response) => {

        const imagePath = path.resolve(__dirname, "../assets/test-image.jpg");

        const aiResponse = await callGeminiApi(imagePath,
            "Analisar a imagem com a medição do consumo de água ou gás e retornar esse valor"
        );

        response.status(200).send(aiResponse);
    });

    app.post("/upload", async (request : Request, response : Response) : Promise<void> => {

        const {image, customer_code, measure_datetime, measure_type} = request.body;

        console.log(request.body);

        if(!image || !customer_code || !measure_datetime || !measure_type)
        {
            response.status(400).json(
            {
                "error_code" : "INVALID_DATA",
                "error_description" : "Os dados fornecidos no corpo da requisição são inválidos."
            });

            return;
        }

        const geminiApiResponse = await uploadImage(image, customer_code, measure_datetime, measure_type);

        response.status(200).json(geminiApiResponse);

    });

    

    export default app;