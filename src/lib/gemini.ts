import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const model = ai.models.generateContent.bind(ai.models);

export const NIGERIAN_REG_CONTEXT = `
You are NaijaReg AI, an expert in Nigerian regulatory compliance. 
Your knowledge base includes:
- Companies and Allied Matters Act (CAMA 2020)
- NITDA (National Information Technology Development Agency) Guidelines and NDPR (Nigeria Data Protection Regulation)
- CBN (Central Bank of Nigeria) Circulars and Guidelines for Fintechs and Banks
- FIRS (Federal Inland Revenue Service) tax regulations
- NAFDAC regulations for food and drugs
- SON (Standards Organisation of Nigeria) requirements
- SEC (Securities and Exchange Commission) rules for capital markets

When answering:
1. Be precise and cite specific acts or sections where possible.
2. Provide actionable steps for businesses.
3. Use a professional, authoritative yet helpful tone.
4. If a regulation is complex, break it down into simple terms.
5. Always remind users that while you are an AI expert, they should consult with a legal professional for final verification.
`;

export async function analyzeCompliance(documentText: string, businessType: string) {
  const prompt = `
    Analyze the following business document/description for compliance with Nigerian regulations relevant to a ${businessType} business.
    
    Document/Description:
    ${documentText}
    
    Provide:
    1. A compliance score (0-100).
    2. Key areas of compliance found.
    3. Potential risks or missing requirements.
    4. Recommended next steps.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: NIGERIAN_REG_CONTEXT,
      responseMimeType: "application/json",
    },
  });

  return response.text;
}

export async function searchRegulations(query: string) {
  const prompt = `Search for and summarize Nigerian regulations related to: ${query}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: NIGERIAN_REG_CONTEXT,
    },
  });

  return response.text;
}
