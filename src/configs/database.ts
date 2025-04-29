import mongoose from "mongoose";


async function connectDatabase(MONGODB_URI : string): Promise<void>
{
    if (!MONGODB_URI)
    {
        throw new Error("Erro na URI do banco de dados, conferir variaveis de ambiente");
    }

    try {

        await mongoose.connect(MONGODB_URI);
        console.log("Conectado ao mongoDB com sucesso");

    } catch(error) {
        console.log(`Erro ao conectar no banco de dados: ${error}`);
        process.exit(1);
    }
}


export default connectDatabase;