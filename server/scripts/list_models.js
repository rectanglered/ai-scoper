const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get access, or use list method if available directly on genAI or via equivalent.
        // Actually the SDK might not expose listModels directly on the top level instance in all versions. 
        // Let's check documentation or try a specific unexpected endpoint?
        // Wait, the error message literally says "Call ListModels to see the list of available models". 
        // In the Node SDK, it's usually `genAI.getGenerativeModel` but listing might be different.
        // Let's try to just use a known working model for now or try to finding the model.
        // Actually, I will write a script that tries to just print the error which lists models or use a different approach.
        // A better approach for the node SDK:
        // currently there isn't a direct `listModels` in the high level `GoogleGenerativeAI` class in some versions.
        // But let's try assuming standard REST or a specific known model if the user said "gemini-2.5-flash". 
        // Wait, the user said "The correct model to use is gemini-2.5-flash". I should trust the user provided hint but also verify.
        // User checks: "you should download the latest model names from google".

        // Let's try to make a raw REST call to list models using the key.
        const key = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
