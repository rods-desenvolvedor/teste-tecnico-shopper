import express from "express";
import callGeminiApi from "./services/geminiService";
import path from "path";
import { uploadMeasure } from "./controllers/measureController";

const app = express();

app.use(express.json());

// ✅ Servir a pasta temp/ estaticamente
app.use("/temp", express.static(path.resolve(__dirname, "../temp")));

app.get("/", async (request, response) => {
    const imagePath = path.resolve(__dirname, "../assets/test-image.jpg");

    const aiResponse = await callGeminiApi(
        imagePath,
        "Analisar a imagem com a medição do consumo de água ou gás e retornar esse valor"
    );

    response.status(200).send(aiResponse);
});

// ✅ Rota oficial do upload
app.post("/upload", uploadMeasure);

export default app;
