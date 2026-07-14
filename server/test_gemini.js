const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  console.log("Using key:", process.env.GEMINI_API_KEY ? (process.env.GEMINI_API_KEY.substring(0, 12) + "...") : "undefined");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent("Hello, are you there?");
    console.log("Success! Response text:");
    console.log(result.response.text());
  } catch (err) {
    console.error("❌ Error caught in test:");
    console.error(err);
  }
}

run();
