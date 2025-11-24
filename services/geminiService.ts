
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuestionType, EvaluationResult } from '../types';

// This is a global variable from the pdf.js CDN script in index.html
declare const pdfjsLib: any;

/**
 * Safely retrieves the API key from the environment.
 * Handles cases where process is not defined (browser) or Vite env vars are used.
 */
const getApiKey = (): string => {
  try {
    // Check standard process.env (Node/Webpack/Polyfill)
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
    // Check Vite-specific env (common in Netlify deployments)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    console.warn("Error accessing environment variables:", e);
  }
  
  throw new Error("API Key is missing. Please set the 'API_KEY' (or 'VITE_API_KEY') environment variable in your Netlify Site Settings.");
};

/**
 * Extracts text content from an uploaded PDF file.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file"));
      }
      try {
        const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((s: any) => s.str).join(' ');
        }
        resolve(textContent);
      } catch (error) {
        reject(new Error("Failed to parse PDF: " + (error as Error).message));
      }
    };
    fileReader.onerror = () => reject(new Error("Error reading file"));
    fileReader.readAsArrayBuffer(file);
  });
}

// Unified schema to handle all types
const quizSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description: 'An array of quiz questions.',
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
             type: Type.STRING,
             description: 'The type of question generated (e.g., MCQ, Short, Long, CaseBased).'
          },
          context: {
             type: Type.STRING,
             description: 'For Case Based or Extract Based questions, this is the paragraph/case study text. Empty for others.'
          },
          question: {
            type: Type.STRING,
            description: 'The text of the question. For Fill in Blanks, use underscores (_______) to denote the blank.',
          },
          options: {
            type: Type.ARRAY,
            description: 'Array of 4 options (Only required if type is MCQ).',
            items: { type: Type.STRING },
          },
          correctAnswer: {
            type: Type.STRING,
            description: 'For MCQ: The correct option. For FillBlanks: The exact word(s) to fill. Empty for subjective.',
          },
          modelAnswer: {
            type: Type.STRING,
            description: 'For Subjective/Short/Long: A high-quality, "Topper Style" answer that would get full marks in a Board Exam. Includes points, keywords, and structure. Empty for MCQs.'
          },
          explanation: {
            type: Type.STRING,
            description: 'A concise explanation of the concept or why the answer is correct.'
          }
        },
        required: ['question', 'type'],
      },
    },
  },
  required: ['questions'],
};

function getMarksForType(type: string): number {
    switch (type) {
        case 'MCQ': return 1;
        case 'FillBlanks': return 1;
        case 'VeryShort': return 2;
        case 'Short': return 3;
        case 'CaseBased': return 4;
        case 'ExtractBased': return 4;
        case 'Long': return 5;
        default: return 1;
    }
}


/**
 * Generates a quiz using the Gemini API based on the provided text.
 */
export async function generateQuiz(
  pdfText: string, 
  numQuestions: number, 
  difficulty: string,
  questionType: QuestionType,
  examContext: string
): Promise<QuizQuestion[]> {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  let typeInstructions = "";
  
  const contextLabel = examContext ? `"${examContext}"` : "Standard Board Exam";

  if (questionType === 'MCQ') {
    typeInstructions = `Generate Multiple Choice Questions suitable for ${contextLabel}. Provide 4 options and 1 correct answer.`;
  } else if (questionType === 'FillBlanks') {
    typeInstructions = `Generate Fill in the Blank questions suitable for ${contextLabel}. The question text must contain "______" where the word goes. 'correctAnswer' must be the missing word(s). Do not provide options.`;
  } else if (['Short', 'VeryShort', 'Long', 'Brief'].includes(questionType)) {
    typeInstructions = `Generate ${questionType} Answer Type Questions. 
    CRITICAL: You are an expert Examiner for ${contextLabel}. 
    - You MUST provide a 'modelAnswer' field.
    - The 'modelAnswer' must be a "Topper's Answer" that scores full marks in ${contextLabel}.
    - Analyze strictly based on ${contextLabel} marking schemes: use point-wise answers, highlight keywords, and structure the answer exactly how a student needs to write it.
    - Do not just copy the PDF text. Synthesize a perfect exam answer.
    - 'options' and 'correctAnswer' fields should be empty/null.`;
  } else if (['CaseBased', 'ExtractBased'].includes(questionType)) {
     typeInstructions = `Generate ${questionType} questions suitable for ${contextLabel}.
     - Select a relevant paragraph or case from the text and put it in the 'context' field.
     - Ask a question based on that context.
     - Provide a 'modelAnswer' that yields full marks based on the context and ${contextLabel} standards.`;
  }

  const prompt = `
  Role: You are an expert Exam Setter and Examiner for ${examContext || "General Education"}.
  Task: Create a quiz/test based on the provided text.
  
  Configuration:
  - Question Type: ${questionType}
  - Quantity: ${numQuestions} questions
  - Difficulty: ${difficulty}
  - Exam Context/Focus: ${examContext || "Standard Academic Standard"}
  
  Instructions:
  ${typeInstructions}
  
  General Rules:
  - Ensure questions are relevant to the provided text.
  - Explanation field should clarify the concept for revision.

  Text Content:
  ---
  ${pdfText.substring(0, 30000)}
  ---
  `;

  // Helper to parse and validate
  const processResponse = (jsonString: string) => {
      const parsed = JSON.parse(jsonString);
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid response format from AI. Expected a 'questions' array.");
      }
      return parsed.questions.map((q: any) => ({
          type: questionType, 
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer || "",
          modelAnswer: q.modelAnswer || "",
          context: q.context || "",
          explanation: q.explanation || "",
          marks: getMarksForType(questionType)
      }));
  };

  try {
    // Attempt with Gemini 3 Pro (Preferred for logic/topper answers)
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    return processResponse(response.text.trim());

  } catch (error: any) {
    console.warn("Gemini 3 Pro failed, retrying with Gemini 2.5 Flash...", error);
    
    // Fallback to Gemini 2.5 Flash for stability/speed if 3 Pro is unavailable/errored
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });
        return processResponse(response.text.trim());
    } catch (retryError: any) {
        console.error("Gemini generation failed:", retryError);
        const msg = retryError.message || error.message || "Unknown error";
        throw new Error(`AI Generation Failed: ${msg}. Please check your API Key and Quota.`);
    }
  }
}

/**
 * Evaluates a student's uploaded answer image against the model answer.
 */
export async function evaluateAnswer(
  question: string,
  modelAnswer: string,
  imageBase64: string,
  mimeType: string,
  maxMarks: number
): Promise<EvaluationResult> {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const evaluationSchema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "Marks awarded out of maxMarks" },
        maxMarks: { type: Type.NUMBER, description: "The maximum marks possible" },
        mistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific errors or missing points" },
        feedback: { type: Type.STRING, description: "Constructive feedback on how to improve to topper level" }
      },
      required: ["score", "maxMarks", "mistakes", "feedback"]
    };

    const prompt = `
    Role: Strict CBSE Board Examiner.
    Task: Grade the student's handwritten answer (image) against the reference Topper Answer.
    
    Question: ${question}
    Reference Topper Answer: ${modelAnswer}
    Maximum Marks: ${maxMarks}

    Instructions:
    1. Read the handwriting in the image.
    2. Compare it strictly with the Topper Answer.
    3. Award marks based on CBSE step-marking (keywords, definition, structure).
    4. List where marks were cut (mistakes).
    5. Provide brief advice.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: imageBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: evaluationSchema
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as EvaluationResult;
    } catch (error: any) {
        console.error("Error evaluating answer:", error);
        throw new Error(`Evaluation failed: ${error.message || "Please check your API Key."}`);
    }
}
