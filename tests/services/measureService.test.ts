import uploadImage from "../../src/services/measureService";
import callGeminiApi from "../../src/services/geminiService";
import fs from "fs";


jest.mock("../../src/services/geminiService", () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe("uploadImage", () => {
    const dummyBase64 = Buffer.from("conteúdo fictício").toString("base64");

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("deve salvar a imagem e retornar a resposta da API Gemini", async () => {
        const fakeGeminiResponse = "12345";
        (callGeminiApi as jest.Mock).mockResolvedValue(fakeGeminiResponse);

        const result = await uploadImage(
            dummyBase64,
            "12345",
            "2025-05-01T12:00:00Z",
            "WATER"
        );

        expect(result).toBe(fakeGeminiResponse);
        expect(callGeminiApi).toHaveBeenCalledTimes(1);
    });

    it("deve lançar erro se a imagem base64 não for fornecida", async () => {
        const invalidBase64 = "";

        await expect(
            uploadImage(
                invalidBase64,
                "12345",
                "2025-05-01T12:00:00Z",
                "WATER"
            )
        ).rejects.toThrow("Imagem em base64 inválida.");
    });

    it("deve lançar erro se ocorrer falha ao salvar o arquivo temporário", async () => {
        jest.spyOn(fs.promises, "writeFile").mockRejectedValueOnce(new Error("Falha ao salvar arquivo"));

        await expect(
            uploadImage(
                dummyBase64,
                "12345",
                "2025-05-01T12:00:00Z",
                "WATER"
            )
        ).rejects.toThrow("Falha ao processar a imagem ou chamar a API do Gemini.");
    });

    it("deve lançar erro se a API Gemini falhar", async () => {
        (callGeminiApi as jest.Mock).mockRejectedValueOnce(new Error("Falha na Gemini"));

        await expect(
            uploadImage(
                dummyBase64,
                "12345",
                "2025-05-01T12:00:00Z",
                "WATER"
            )
        ).rejects.toThrow("Falha ao processar a imagem ou chamar a API do Gemini.");
    });
});
