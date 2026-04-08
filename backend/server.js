const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors()); // Permite que o Frontend (porta 5173) converse com o Backend (porta 3000)

// --- CONEXÃO COM O COFRE ---
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://aidoctorbr_db_user:<db_password>@sae.ecjyjeg.mongodb.net';
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ API CONECTADA AO COFRE MONGODB"))
    .catch(err => console.error("❌ ERRO NO BANCO:", err));

// --- SCHEMA DO RABI ---
const AnaliseSchema = new mongoose.Schema({
    timestamp: Date,
    mercado: String,
    termo_chave: String,
    evolucao: Number,
    volume_score: Number,
    score_rabi: Number,
    status_tendencia: String,
    categoria: String
});
const IntelRABI = mongoose.model('IntelRABI', AnaliseSchema);

// --- ROTA DA API (O Ponto de Contato) ---
app.get('/api/radar', async (req, res) => {
    try {
        // Busca os 10 termos com maior Score RABI
        const dados = await IntelRABI.find().sort({ score_rabi: -1 }).limit(10);
        res.json(dados);
    } catch (error) {
        res.status(500).json({ error: "Erro na leitura da inteligência" });
    }
});

// Ligar a API
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR API RABI OMNI RODANDO NA PORTA ${PORT}`);
});