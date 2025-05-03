import * as geminiService from "../../src/services/geminiService";
import uploadImage from "../../src/services/measureService";
import { UploadImageDTO } from "../../src/dtos/uploadImageDTO";
import fs from "fs";

// Mock do módulo geminiService
jest.mock("../../src/services/geminiService", () => ({
    callGeminiApi: jest.fn(),
}));

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

    it("deve salvar a imagem e retornar a resposta da API Gemini", async () => {
        (geminiService.callGeminiApi as jest.Mock).mockResolvedValue(fakeGeminiResponse);

        const result = await uploadImage(uploadDTO);

        expect(result).toHaveProperty("image_url");
        expect(result).toHaveProperty("measure_value", 123);
        expect(result).toHaveProperty("measure_uuid");

        expect(geminiService.callGeminiApi).toHaveBeenCalledTimes(1);
    });

    it("deve lançar erro se a imagem base64 não for fornecida", async () => {
        const invalidDTO = { ...uploadDTO, base64Image: "" };

        await expect(uploadImage(invalidDTO))
            .rejects.toThrow("Imagem em base64 inválida.");
    });

    it("deve lançar erro se ocorrer falha ao salvar o arquivo temporário", async () => {
        jest.spyOn(fs.promises, "writeFile").mockRejectedValueOnce(new Error("Falha ao salvar arquivo"));

        await expect(uploadImage(uploadDTO))
            .rejects.toThrow("Falha ao processar a imagem ou chamar a API do Gemini.");
    });

    it("deve lançar erro se a API Gemini falhar", async () => {
        (geminiService.callGeminiApi as jest.Mock).mockRejectedValue(new Error("Falha na Gemini"));

        await expect(uploadImage(uploadDTO))
            .rejects.toThrow("Falha ao processar a imagem ou chamar a API do Gemini.");
    });
});
