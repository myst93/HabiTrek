const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Listing models...");
    const models = await genAI.listModels();
    console.log("Success! Models list:");
    for (const m of models) {
      console.log(m.name);
    }
  } catch (err) {
    console.error("❌ Error caught in listModels:");
    console.error(err);
  }
}

run();
