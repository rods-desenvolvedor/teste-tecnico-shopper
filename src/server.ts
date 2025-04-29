import "dotenv/config";
import connectDatabase from "./configs/database";
import app from "./app";


const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "";

async function startServer() {
    await connectDatabase(MONGODB_URI);

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

startServer();