
export interface UploadImageDTO {
    base64Image: string;
    customer_code: string;
    measure_datetime: string;
    measure_type: string;
}

export interface UploadImageResponseDTO {
    image_url: string;
    measure_value: number;
    measure_uuid: string;
}
