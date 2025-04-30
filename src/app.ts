import express from "express";
import callGeminiApi from "./services/geminiService";
import path from "path";

const app = express();

app.get("/", async (request, response) => {

    const imagePath = path.resolve(__dirname, "../assets/test-image.jpg");

    const aiResponse = await callGeminiApi(imagePath,
        "Analisar a imagem com a medição do consumo de água ou gás e retornar esse valor"
    );

    response.status(200).send(aiResponse);
})

export default app;