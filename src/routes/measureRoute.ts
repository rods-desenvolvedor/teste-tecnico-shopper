import express from "express";
import { uploadMeasure } from "../controllers/measureController";

const router = express.Router();

router.post("/upload", uploadMeasure);


export default router;