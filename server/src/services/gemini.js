const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ErrorLog } = require('../database');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function logGemini(action, status, details = "") {
  const timestamp = new Date().toISOString();
  let color = "\x1b[32m"; // green for success
  let level = 'info';

  if (status === 'START') {
    color = "\x1b[33m"; // yellow for start
    level = 'info';
  }
  if (status === 'ERROR') {
    color = "\x1b[31m"; // red for error
    level = 'error';
  }
  const reset = "\x1b[0m";

  const msg = `[GEMINI] ${action} | ${status}${details ? ` | ${details}` : ''}`;
  console.log(`${color}${timestamp} | ${msg}${reset}`);

  try {
    // Log to database
    await ErrorLog.create({
      level: level,
      message: msg,
      timestamp: new Date()
    });
  } catch (e) {
    console.error("Failed to write log to DB:", e);
  }
}

async function generateNextQuestion(projectIdea, history) {
  await logGemini('Generate Question', 'START');
  try {
    const prompt = `
      Context:
      System: You are Daniel, a software architect.
      Project Idea: ${projectIdea}
      Conversation History: ${JSON.stringify(history)}
      
      Task: Ask the next most important question to clarify the scope. 
      Output only the question.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    await logGemini('Generate Question', 'SUCCESS');
    return response;
  } catch (error) {
    await logGemini('Generate Question', 'ERROR', error.message);
    throw error;
  }
}

const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

async function getExampleContent() {
  try {
    const example1Path = path.join(__dirname, '..', 'Example1.docx');
    const example2Path = path.join(__dirname, '..', 'Example2.docx');

    // Helper to extract text safely
    const extract = async (p) => {
      if (fs.existsSync(p)) {
        const result = await mammoth.extractRawText({ path: p });
        return result.value;
      }
      return "";
    };

    const [text1, text2] = await Promise.all([extract(example1Path), extract(example2Path)]);
    return `
        ---
        EXAMPLE FORMAT 1:
        ${text1.substring(0, 2000)}... (truncated for brevity)
        
        EXAMPLE FORMAT 2:
        ${text2.substring(0, 2000)}...
        ---
        `;
  } catch (e) {
    console.warn("Could not load examples:", e);
    return "";
  }
}

async function generateReport(projectIdea, answers) {
  await logGemini('Generate Report', 'START');
  try {
    const exampleContext = await getExampleContent();

    const prompt = `
      Context:
      Project Idea: ${projectIdea}
      Client Answers: ${JSON.stringify(answers)}
      
      REFERENCE EXAMPLES (STRICTLY FOLLOW THIS STYLE/TONE/STRUCTURE):
      ${exampleContext}
  
      Task: Generate a markdown implementation plan acting as "Daniel", a single, highly competent senior developer who works quickly and efficiently.
      
      CRITICAL INSTRUCTIONS:
      1. **Style**: Use the exact markdown structure and professional yet accessible tone from the examples.
      2. **Persona**: You are ONE developer, not a team. Use "I" (Daniel) or "We" (Rectangle Red) as appropriate, but estimates should reflect a single high-speed expert.
      3. **Currency**: ALL costs must be in **GBP (£)**.
      4. **Rate**: Use a day rate of **£562.50 + VAT**.
      5. **Timeline**: Be realistic but efficient (e.g., "1-2 weeks" for MVP if simple).
      6. **Cost Estimates**: Provide a clear breakdown based on the day rate.
  
      Report Structure:
      1. **Executive Summary**: Brief overview of the solution.
      2. **Scope of Work**: Functional & Non-functional requirements.
      3. **Technical Architecture**: Stack choices and rationale.
      4. **Roadmap / Timeline**: Phased approach.
      5. **Cost Estimates**: Detailed estimate using £562.50/day.
      
      Output nothing but the Markdown report.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    await logGemini('Generate Report', 'SUCCESS');
    return response;
  } catch (error) {
    await logGemini('Generate Report', 'ERROR', error.message);
    throw error;
  }
}

async function generateProjectName(description) {
  await logGemini('Generate Name', 'START');
  try {
    const prompt = `
      Context:
      Project Description: ${description}
      
      Task: Suggest a creative, professional, one-to-three word name for this software project. 
      Output ONLY the name.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    await logGemini('Generate Name', 'SUCCESS', response);
    return response;
  } catch (error) {
    await logGemini('Generate Name', 'ERROR', error.message);
    throw error;
  }
}

async function suggestFeatures(description, platforms, targetUsers) {
  await logGemini('Suggest Features', 'START');
  try {
    const prompt = `
      Context:
      Project Description: ${description}
      Platforms: ${platforms.join(', ')}
      Target Users: ${targetUsers.join(', ')}
      
      Task: Suggest 5-8 common functional modules or features for this specific type of application.
      Examples: "User Authentication", "Payment Gateway", "Analytics Dashboard", "Inventory Management", "Chat System".
      
      Output: A simple JSON array of strings. Example: ["Feature A", "Feature B"]
      Do not include markdown formatting or code blocks. Just the raw JSON string.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean up potential markdown code blocks if the model adds them despite instructions
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const features = JSON.parse(cleanText);
    await logGemini('Suggest Features', 'SUCCESS', `${features.length} suggested`);
    return features;
  } catch (e) {
    await logGemini('Suggest Features', 'ERROR', e.message);
    console.error("Failed to parse feature suggestions:", e);
    return [];
  }
}

module.exports = {
  generateNextQuestion,
  generateReport,
  generateProjectName,
  suggestFeatures
};
