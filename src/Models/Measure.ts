import mongoose, { Schema, Document } from "mongoose";

export interface IMeasure extends Document {
    customer_code: string;
    measure_type: "WATER" | "GAS";
    measure_value: number;
    measure_datetime: Date;
    image_url: string;
    measure_uuid: string;
    created_at: Date;
}

const MeasureSchema: Schema = new Schema({
    customer_code: {
        type: String,
        required: true,
    },
    measure_type: {
        type: String,
        enum: ["WATER", "GAS"],
        required: true,
    },
    measure_value: {
        type: Number,
        required: true,
    },
    measure_datetime: {
        type: Date,
        required: true,
    },
    image_url: {
        type: String,
        required: true,
    },
    measure_uuid: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const Measure = mongoose.model<IMeasure>("Measure", MeasureSchema);

export default Measure;
