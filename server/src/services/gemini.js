const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generateNextQuestion(projectIdea, history) {
  // Convert history format if needed, or just append to prompt
  // For simplicity, we'll construct a prompt.

  const systemPrompt = `
    You are Daniel, an expert software architect at Rectangle Red. 
    Your goal is to scope out a client's software project.
    Ask ONE clear, specific question to gather requirements. 
    Do not ask multiple questions at once.
    Focus on: Features, Users, Platform, Budget, Timeline, or Integrations.
    Keep the tone professional yet friendly.
  `;

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      ...history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      })) // Ensure history matches Gemini format if needed, simplified here
    ],
  });

  // If it's the start, history is empty in the chat initialization logic above (except system prompt)
  // But our 'history' passed in might include the user's initial prompt.
  // Actually, let's just use a prompt approach for simplicity in this stateless wrapper

  // Re-approach: specific prompt for next question
  const prompt = `
    Context:
    System: You are Daniel, a software architect.
    Project Idea: ${projectIdea}
    Conversation History: ${JSON.stringify(history)}
    
    Task: Ask the next most important question to clarify the scope. 
    Output only the question.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
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
  const exampleContext = await getExampleContent();

  const prompt = `
    Context:
    Project Idea: ${projectIdea}
    Client Answers: ${JSON.stringify(answers)}
    
    REFERENCE EXAMPLES (Adopt this style/tone/structure):
    ${exampleContext}

    Task: Generate a markdown implementation plan using the style and structure from the examples above.
    The report should be detailed and professional.
    
    Include sections relevant to the project, such as:
    1. Executive Summary
    2. Scope of Work (Functional & Non-functional)
    3. Technical Architecture
    4. Roadmap / Timeline
    5. Cost Estimates (if implied by budget)
    
    Output in Markdown.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateProjectName(description) {
  const prompt = `
    Context:
    Project Description: ${description}
    
    Task: Suggest a creative, professional, one-to-three word name for this software project. 
    Output ONLY the name.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function suggestFeatures(description, platforms, targetUsers) {
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

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse feature suggestions:", text);
    return [];
  }
}

module.exports = {
  generateNextQuestion,
  generateReport,
  generateProjectName,
  suggestFeatures
};
