import express from "express";
import { uploadMeasure, confirmMeasure } from "../controllers/measureController";

const router = express.Router();

router.post("/upload", uploadMeasure);
router.patch("/confirm", confirmMeasure);



export default router;