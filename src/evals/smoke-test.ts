import 'dotenv/config';
import { Agent } from '../agent/agent.js';
import { getSetting } from '../utils/config.js';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '../model/llm.js';

async function runSmokeTest() {
  console.log("🚀 Iniciando Test E2E Financiero (Modo Ahorro)...");

  const provider = getSetting('provider', DEFAULT_PROVIDER);
  const model = getSetting('modelId', DEFAULT_MODEL);

  if (!process.env.FINANCIAL_DATASETS_API_KEY) {
    console.error("❌ ERROR: FINANCIAL_DATASETS_API_KEY no está configurada. El test fallará.");
    process.exit(1);
  }

  console.log(`🧠 Usando modelo: ${model} (${provider})`);

  // Limitar iteraciones para no gastar tokens si se queda en loop
  const agent = await Agent.create({
    model,
    modelProvider: provider,
    maxIterations: 3
  });

  // Pregunta muy específica y determinista sobre un ticker gratuito (AAPL)
  const query = "What was the exact total revenue for AAPL in the year 2023? Reply ONLY with the number in billions, formatted as exactly '383.28'. Do not add any text.";
  const expectedValue = "383.28";

  console.log(`\n❓ Query: "${query}"`);
  console.log("⚙️  Ejecutando el agente (esto consumirá algunos tokens)...");

  try {
    const startTime = Date.now();
    let answer = '';
    for await (const event of agent.run(query)) {
      if (event.type === 'done') {
        answer = event.answer || '';
      }
    }
    const endTime = Date.now();

    console.log(`\n✅ Ejecución terminada en ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log(`🤖 Respuesta del Agente: "${answer}"`);

    if (answer && answer.includes(expectedValue)) {
      console.log(`\n🎉 TEST SUPERADO: El agente obtuvo el dato financiero correcto matemáticamente.`);
      process.exit(0);
    } else {
      console.error(`\n❌ TEST FALLIDO: Se esperaba encontrar el valor '${expectedValue}' en la respuesta.`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n💥 ERROR FATAL DURANTE LA EJECUCIÓN: ${error.message}`);
    process.exit(1);
  }
}

runSmokeTest();
