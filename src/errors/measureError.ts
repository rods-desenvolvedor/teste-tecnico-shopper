
export class InvalidDataError extends Error {
    constructor(message = "Os dados fornecidos no corpo da requisição são inválidos.") {
        super(message);
        this.name = "InvalidDataError";
    }
}

export class MeasureAlreadyExistsError extends Error {
    constructor(message = "Já existe uma leitura para este tipo de medição no mês atual.") {
        super(message);
        this.name = "MeasureAlreadyExistsError";
    }
}

export class GeminiApiError extends Error {
    constructor(message = "Falha ao processar a imagem ou chamar a API do Gemini.") {
        super(message);
        this.name = "GeminiApiError";
    }
}
