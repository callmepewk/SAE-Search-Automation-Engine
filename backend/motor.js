const googleTrends = require('google-trends-api');
const KEYWORDS = require('./keywords'); 
const readline = require('readline');
const fs = require('fs');
const mongoose = require('mongoose');
const HttpsProxyAgent = require('https-proxy-agent');
const UserAgent = require('user-agents');

// --- ☁️ CONFIGURAÇÃO MONGODB (COFRE DE INTELIGÊNCIA) ---
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://aidoctorbr_db_user:QbtfIw3En6CH7Dre@sae.ecjyjeg.mongodb.net/?appName=SAE';

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ CONEXÃO COM COFRE MONGODB ESTABELECIDA"))
    .catch(err => console.error("❌ ERRO AO CONECTAR NO BANCO:", err));

const AnaliseSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    mercado: String,
    geo: String,
    termo_chave: String,
    termo_local: String,
    evolucao: Number,
    volume_score: Number,
    score_rabi: Number,
    perfil_mercado: String,
    status_tendencia: String,
    diretriz_tatica: String,
    diagnostico: String,
    categoria: String
});

const IntelRABI = mongoose.model('IntelRABI', AnaliseSchema);

// --- 🛡️ CONFIGURAÇÃO DE EVASÃO (STEALTH) ---
// ⚠️ IMPORTANTE: Adicione aqui seus proxies residenciais. 
// Sem isso, o bloqueio ocorrerá após ~20 buscas.
const PROXY_LIST = [
    // 'http://usuario:senha@ip:porta',
    // 'http://usuario2:senha2@ip2:porta2'
]; 

const delayAleatorio = (isError = false) => {
    // Se houve erro (Bloqueio), espera de 30s a 60s. Caso contrário, 7s a 15s.
    const min = isError ? 30000 : 7000;
    const max = isError ? 60000 : 15000;
    const ms = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, ms));
};

const EXPORT_DIR = './exports';
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// --- 🌍 RADAR GEOGRÁFICO COMPLETO ---
const LOCAIS_BUSCA = {
    '🌍 Global (Mundo)': [''],
    '🇧🇷 BRASIL (Nacional)': ['BR'],
    '🇺🇸 EUA (Nacional)': ['US'],
    '🇪🇺 UNIÃO EUROPEIA': ['PT', 'ES', 'FR', 'IT', 'DE', 'GB', 'BE', 'NL'],
    '🌏 ÁSIA (K-Beauty/Japan)': ['KR', 'JP', 'CN', 'TW', 'SG'],
    '🕌 ORIENTE MÉDIO': ['SA', 'AE', 'IL', 'QA', 'TR'],
    '🏢 BR-Estados': ['BR-SP', 'BR-RJ', 'BR-MG', 'BR-ES', 'BR-PR', 'BR-SC', 'BR-RS', 'BR-BA', 'BR-PE', 'BR-CE', 'BR-DF', 'BR-GO', 'BR-AM', 'BR-PA', 'BR-MT', 'BR-MS', 'BR-MA', 'BR-PB', 'BR-RN', 'BR-AL', 'BR-PI', 'BR-SE', 'BR-RO', 'BR-AC', 'BR-RR', 'BR-AP', 'BR-TO'],
    '🇺🇸 US-Top Markets': ['US-CA', 'US-FL', 'US-NY', 'US-TX', 'US-IL', 'US-PA', 'US-OH', 'US-GA', 'US-NC', 'US-MI']
};

// --- 🗣️ ROTEADOR DE IDIOMAS ---
const traduzirParaRegiao = (chave, geo, catOriginal) => {
    let lang = 'pt';
    if (!geo) lang = 'en';
    else if (['KR'].includes(geo)) lang = 'ko';
    else if (['JP'].includes(geo)) lang = 'ja';
    else if (['CN', 'TW'].includes(geo)) lang = 'zh';
    else if (['IT'].includes(geo)) lang = 'it';
    else if (['FR', 'BE'].includes(geo)) lang = 'fr';
    else if (['ES', 'MX', 'AR', 'CL', 'CO'].includes(geo)) lang = 'es';
    else if (['US', 'GB', 'CA', 'AU', 'AE', 'SA', 'QA'].includes(geo)) lang = 'en';

    const baseCatName = catOriginal.split('_')[0];
    const categoriaTraduzida = `${baseCatName}_${lang}`;
    
    return (KEYWORDS[categoriaTraduzida] && KEYWORDS[categoriaTraduzida][chave]) 
        ? KEYWORDS[categoriaTraduzida][chave][0] 
        : KEYWORDS[catOriginal][chave][0];
};

// --- 📊 ANALISADOR DE INTELIGÊNCIA ---
function gerarAnaliseOMNI(termo, cresc, interesse, local, categoria) {
    const i = parseInt(interesse);
    const e = parseFloat(cresc);
    let perfil = i > 75 ? 'ALTA ESCALA / POPULAR' : 'PREMIUM / NICHO';
    let tendencia = e > 30 ? 'EXPLOSÃO (TRENDING)' : e > 0 ? 'CRESCIMENTO ESTÁVEL' : 'SATURAÇÃO / QUEDA';
    
    let insight = "";
    if (categoria.includes('intencao')) insight = "Foco em conversão direta e preço.";
    else if (categoria.includes('fabricantes')) insight = "Movimentação B2B / Aquisição de máquinas.";
    else if (categoria.includes('anatomia')) insight = "Oportunidade para criativos focados na área.";
    else insight = "Interesse geral de consumo.";

    return {
        'Score RABI': i + (e / 2),
        'Perfil Mercado': perfil,
        'Status Tendência': tendencia,
        'Diretriz Tática': insight,
        'Diagnóstico': `Em ${local}, o termo ${termo} evoluiu ${e.toFixed(2)}%.`
    };
}

// --- ⚙️ O MOTOR PRINCIPAL (VERSÃO ÚNICA E CORRIGIDA) ---
async function executarMotor(palavras, locais, periodo) {
    let buscasTotal = 0;
    palavras.forEach(p => { locais.forEach(l => { l.codes.forEach(() => { buscasTotal++; }); }); });

    // Cálculo de ETA (Tempo Estimado)
    const tempoMedio = 13; 
    const totalS = buscasTotal * tempoMedio;
    const h = Math.floor(totalS / 3600);
    const m = Math.floor((totalS % 3600) / 60);
    const s = totalS % 60;

    console.log(`\n==================================================`);
    console.log(`🚀 BRIEFING DE MISSÃO RABI OMNI V41.2`);
    console.log(`- Amostra: ${palavras.length} termos estratégicos`);
    console.log(`- Consultas Google estimadas: ${buscasTotal}`);
    console.log(`- Tempo Estimado (ETA): ${h}h ${m}m ${s}s`);
    console.log(`- Proteção: User-Agent Dinâmico + ${PROXY_LIST.length > 0 ? 'Proxy Ativo' : '⚠️ IP LOCAL'}`);
    console.log(`==================================================\n`);

    rl.question("⚠️ Comandante, autoriza o disparo? (S/N/0 para Abortar): ", async (confirm) => {
        if (confirm === '0' || confirm.toLowerCase() !== 's') return exibirMenu();

        const resultados = [];
        let contador = 0;

        for (const p of palavras) {
            console.log(`\n🔎 [VARREDURA]: ${p.chave.toUpperCase()}`);
            for (const l of locais) {
                for (const geo of l.codes) {
                    contador++;
                    const termoTraduzido = traduzirParaRegiao(p.chave, geo, p.catOriginal);
                    process.stdout.write(`   [${contador}/${buscasTotal}] -> ${l.nome} (${geo || 'Global'})... `);
                    
                    try {
                        const ua = new UserAgent({ deviceCategory: 'desktop' }).toString();
                        let agent = null;
                        if (PROXY_LIST.length > 0) {
                            const proxyUrl = PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)];
                            agent = new HttpsProxyAgent(proxyUrl);
                        }

                        const res = await googleTrends.interestOverTime({
                            keyword: termoTraduzido,
                            geo: geo,
                            agent: agent,
                            requestHeader: { 'User-Agent': ua },
                            startTime: periodo.includes('-') ? new Date(periodo) : (periodo.startsWith('now') ? periodo : new Date(Date.now() - (parseInt(periodo) * 24 * 60 * 60 * 1000)))
                        });

                        const data = JSON.parse(res).default.timelineData;
                        if (data.length > 0) {
                            const vInit = data[0].value[0];
                            const vEnd = data[data.length - 1].value[0];
                            const cresc = vInit > 0 ? ((vEnd - vInit) / vInit) * 100 : 0;
                            const omniData = gerarAnaliseOMNI(p.chave, cresc, vEnd, l.nome, p.catOriginal);
                            
                            resultados.push({
                                Timestamp: new Date().toLocaleString(),
                                Mercado: l.nome,
                                Termo: p.chave,
                                Evolucao: cresc.toFixed(2) + "%",
                                ...omniData
                            });
                            process.stdout.write(`✅ [${cresc.toFixed(2)}%]\n`);
                        } else {
                            process.stdout.write(`⚠️ Sem volume\n`);
                        }
                        await delayAleatorio(); 

                    } catch (err) { 
                        process.stdout.write(`❌ Bloqueio detectado. Resfriando motor... \n`);
                        await delayAleatorio(true); 
                    }
                }
            }
        }

        if (resultados.length > 0) {
            const csv = new Parser().parse(resultados);
            const path = `${EXPORT_DIR}/OMNI_BI_${Date.now()}.csv`;
            fs.writeFileSync(path, csv);
            console.log(`\n💾 INTELIGÊNCIA SALVA EM: ${path}`);
            console.table(resultados.sort((a,b) => b['Score RABI'] - a['Score RABI']).slice(0, 15));
        }
        rl.question("\nENTER para retornar ao painel central.", () => exibirMenu());
    });
}

function exibirMenu() {
    console.clear();
    console.log("==================================================");
    console.log("🚀 SAE / RABI - GLOBAL STRATEGIC BI V41.2 (OMNI)");
    console.log("==================================================\n");

    console.log("1. Período: [1] 1h | [2] 24h | [3] 30d | [4] 90d | [5] 365d | [6] 2020+ | [0] SAIR");
    rl.question("\n👉 Escolha: ", (t) => {
        if (t === '0') process.exit(0);
        let p = t==='1'?'now 1-h':t==='2'?'now 1-d':t==='4'?'90':t==='5'?'365':t==='6'?'2020-01-01':'30';

        const keys = Object.keys(LOCAIS_BUSCA);
        console.log("\n2. Mercado Alvo:");
        keys.forEach((l, i) => process.stdout.write(`[${i}] ${l.padEnd(20)} ${(i+1)%3===0?'\n':''}`));
        
        rl.question("\n👉 Selecione: ", (idx) => {
            if (idx === '0') process.exit(0);
            let locaisSel = [{ nome: keys[idx], codes: LOCAIS_BUSCA[keys[idx]] }];

            console.log("\n3. Modo de Carga:");
            console.log("[1] Banco Completo | [2] Lote Aleatório | [3] Sniper | [4] Top 5 | [5] Top 10");
            
            rl.question("\n👉 Escolha: ", (modo) => {
                let banco = [];
                for (const cat in KEYWORDS) {
                    if (cat.endsWith('_pt')) {
                        const chaves = Object.keys(KEYWORDS[cat]);
                        if (modo === '4' || modo === '5') {
                            const limit = modo === '4' ? 5 : 10;
                            chaves.slice(0, limit).forEach(chave => banco.push({ catOriginal: cat, chave }));
                        } else {
                            chaves.forEach(chave => banco.push({ catOriginal: cat, chave }));
                        }
                    }
                }

                if (modo === '3') {
                    rl.question("\n🎯 Alvos Sniper (vírgula): ", (txt) => {
                        const alvos = txt.split(',').map(s => s.trim().toLowerCase());
                        const filtrados = banco.filter(b => alvos.includes(b.chave.toLowerCase()));
                        executarMotor(filtrados, locaisSel, p);
                    });
                } else if (modo === '2') {
                    rl.question(`\n👉 Quantidade (Máx: ${banco.length}): `, (q) => {
                        const lista = banco.sort(() => 0.5 - Math.random()).slice(0, parseInt(q));
                        executarMotor(lista, locaisSel, p);
                    });
                } else {
                    executarMotor(banco, locaisSel, p);
                }
            });
        });
    });
}

exibirMenu();