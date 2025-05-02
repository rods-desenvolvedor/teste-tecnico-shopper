import express from "express";
import callGeminiApi from "./services/geminiService";
import path from "path";
import { uploadMeasure } from "./controllers/measureController";
import measureRoutes from "./routes/measureRoute";

const app = express();

app.use(express.json());

app.use("/temp", express.static(path.resolve(__dirname, "../temp")));

app.use(measureRoutes);

export default app;
