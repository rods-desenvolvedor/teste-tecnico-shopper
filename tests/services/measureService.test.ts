import * as geminiService from "../../src/services/geminiService";
import uploadImage from "../../src/services/measureService";
import { UploadImageDTO } from "../../src/dtos/uploadImageDTO";
import fs from "fs";
import MeasureModel from "../../src/Models/Measure";
import { InvalidDataError, MeasureAlreadyExistsError } from "../../src/errors/measureError";


jest.mock("../../src/services/geminiService", () => ({
    callGeminiApi: jest.fn(),
}));


jest.mock("../../src/Models/Measure");

describe("uploadImage", () => {

    const dummyBase64 = Buffer.from("imagem fake").toString("base64");
    const fakeGeminiResponse = "Valor lido: 123 m³";

    const uploadDTO: UploadImageDTO = {
        base64Image: dummyBase64,
        customer_code: "12345",
        measure_datetime: "2025-05-01T12:00:00Z",
        measure_type: "WATER",
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("deve salvar a imagem, persistir a medição no banco e retornar os dados corretos", async () => {
        (geminiService.callGeminiApi as jest.Mock).mockResolvedValue(fakeGeminiResponse);
        (MeasureModel.findOne as jest.Mock).mockResolvedValue(null);  
        (MeasureModel.create as jest.Mock).mockResolvedValue({});   

        const result = await uploadImage(uploadDTO);

        expect(result).toHaveProperty("image_url");
        expect(result).toHaveProperty("measure_value", 123);
        expect(result).toHaveProperty("measure_uuid");

        expect(MeasureModel.create).toHaveBeenCalled();
    });

    it("deve lançar erro se a imagem base64 não for fornecida", async () => {
        const invalidDTO = { ...uploadDTO, base64Image: "" };

        await expect(uploadImage(invalidDTO))
            .rejects.toThrow(InvalidDataError);
    });

    it("deve lançar erro se ocorrer falha ao salvar o arquivo temporário", async () => {
        jest.spyOn(fs.promises, "writeFile").mockRejectedValueOnce(new Error("Falha ao salvar arquivo"));
        (MeasureModel.findOne as jest.Mock).mockResolvedValue(null);  

        await expect(uploadImage(uploadDTO))
            .rejects.toThrow("Falha ao processar a imagem ou chamar a API do Gemini.");
    });

    it("deve lançar erro se a API Gemini falhar", async () => {
        (geminiService.callGeminiApi as jest.Mock).mockRejectedValue(new Error("Falha na Gemini"));
        (MeasureModel.findOne as jest.Mock).mockResolvedValue(null); 

        await expect(uploadImage(uploadDTO))
            .rejects.toThrow("Falha ao processar a imagem ou chamar a API do Gemini.");
    });

    it("deve lançar erro se já existir uma medição para o mesmo mês e tipo", async () => {
        (geminiService.callGeminiApi as jest.Mock).mockResolvedValue(fakeGeminiResponse); 
        (MeasureModel.findOne as jest.Mock).mockResolvedValueOnce({ id: "existing-id" }); 
    
        await expect(uploadImage(uploadDTO))
            .rejects.toThrow(MeasureAlreadyExistsError);
    });
});
