import * as geminiService from "../../src/services/geminiService";
import uploadImage from "../../src/services/measureService";
import { UploadImageDTO } from "../../src/dtos/uploadImageDTO";
import fs from "fs";
import MeasureModel from "../../src/Models/Measure";
import { InvalidDataError, MeasureAlreadyExistsError, MeasureNotFoundError } from "../../src/errors/measureError";
import { confirmMeasureService, listMeasuresService } from "../../src/services/measureService";

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

describe("confirmMeasureService", () => {
    const fakeUuid = "fake-uuid";
    const confirmedValue = 1234;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("deve lançar MeasureNotFoundError se a medição não existir", async () => {
        (MeasureModel.findOne as jest.Mock).mockResolvedValue(null);

        await expect(confirmMeasureService(fakeUuid, confirmedValue))
            .rejects.toThrow(MeasureNotFoundError);
    });

    it("deve lançar InvalidDataError se a medição já estiver confirmada", async () => {
        const fakeMeasure = { 
            has_confirmed: true, 
            confirmed_value: 1234,
            save: jest.fn() 
        };
        (MeasureModel.findOne as jest.Mock).mockResolvedValue(fakeMeasure);

        await expect(confirmMeasureService(fakeUuid, confirmedValue))
            .rejects.toThrow(InvalidDataError);
    });

    it("deve atualizar a medição corretamente se tudo estiver certo", async () => {
        const saveMock = jest.fn(function (this: any) {
            this.has_confirmed = true;
            this.confirmed_value = confirmedValue;
            return Promise.resolve(this);
        });
        const fakeMeasure: any = { has_confirmed: false, confirmed_value: undefined, save: saveMock };
        (MeasureModel.findOne as jest.Mock).mockResolvedValue(fakeMeasure);
    
        await confirmMeasureService(fakeUuid, confirmedValue);
    
        expect(fakeMeasure.confirmed_value).toBe(confirmedValue);
        expect(fakeMeasure.has_confirmed).toBe(true);
        expect(saveMock).toHaveBeenCalled();
    });

    it("deve propagar erro inesperado", async () => {
        (MeasureModel.findOne as jest.Mock).mockRejectedValue(new Error("Erro inesperado"));

        await expect(confirmMeasureService(fakeUuid, confirmedValue))
            .rejects.toThrow("Erro inesperado");
    });
});


describe("listMeasuresService", () => {
    const fakeCustomerCode = "12345";

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("deve retornar a lista de medições corretamente sem filtro", async () => {
        const fakeMeasures = [
            {
                measure_uuid: "uuid-1",
                measure_datetime: new Date(),
                measure_type: "WATER",
                has_confirmed: false,
                image_url: "http://example.com/image1.jpg"
            },
            {
                measure_uuid: "uuid-2",
                measure_datetime: new Date(),
                measure_type: "GAS",
                has_confirmed: true,
                image_url: "http://example.com/image2.jpg"
            }
        ];

        (MeasureModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeMeasures)
        });

        const result = await listMeasuresService(fakeCustomerCode);

        expect(result.customer_code).toBe(fakeCustomerCode);
        expect(result.measures).toHaveLength(2);
        expect(result.measures[0]).toHaveProperty("measure_uuid", "uuid-1");
    });

    it("deve retornar a lista filtrada por measure_type", async () => {
        const fakeMeasures = [
            {
                measure_uuid: "uuid-1",
                measure_datetime: new Date(),
                measure_type: "WATER",
                has_confirmed: false,
                image_url: "http://example.com/image1.jpg"
            }
        ];

        (MeasureModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeMeasures)
        });

        const result = await listMeasuresService(fakeCustomerCode, "WATER");

        expect(result.customer_code).toBe(fakeCustomerCode);
        expect(result.measures).toHaveLength(1);
        expect(result.measures[0]).toHaveProperty("measure_type", "WATER");
    });

    it("deve lançar InvalidDataError se measure_type for inválido", async () => {
        await expect(listMeasuresService(fakeCustomerCode, "INVALID"))
            .rejects.toThrow(InvalidDataError);
    });

    it("deve lançar erro 404 se nenhuma medição for encontrada", async () => {
        (MeasureModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });

        await expect(listMeasuresService(fakeCustomerCode))
            .rejects.toThrow("Nenhuma leitura encontrada");
    });

    it("deve propagar erro inesperado", async () => {
        (MeasureModel.find as jest.Mock).mockImplementation(() => {
            throw new Error("Erro inesperado");
        });

        await expect(listMeasuresService(fakeCustomerCode))
            .rejects.toThrow("Erro inesperado");
    });
});