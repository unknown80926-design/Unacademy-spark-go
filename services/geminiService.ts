
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuestionType, EvaluationResult } from '../types';

// This is a global variable from the pdf.js CDN script in index.html
declare const pdfjsLib: any;

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
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let typeInstructions = "";
  
  if (questionType === 'MCQ') {
    typeInstructions = `Generate Multiple Choice Questions. Provide 4 options and 1 correct answer.`;
  } else if (questionType === 'FillBlanks') {
    typeInstructions = `Generate Fill in the Blank questions. The question text must contain "______" where the word goes. 'correctAnswer' must be the missing word(s). Do not provide options.`;
  } else if (['Short', 'VeryShort', 'Long', 'Brief'].includes(questionType)) {
    typeInstructions = `Generate ${questionType} Answer Type Questions. 
    CRITICAL: You are an expert Board Examiner (e.g., CBSE Class 10/12). 
    - You MUST provide a 'modelAnswer' field.
    - The 'modelAnswer' must be a "Topper's Answer".
    - Analyze previous board topper sheets: use point-wise answers, highlight keywords, and structure the answer exactly how a student needs to write it to get FULL MARKS.
    - Do not just copy the PDF text. Synthesize a perfect exam answer.
    - 'options' and 'correctAnswer' fields should be empty/null.`;
  } else if (['CaseBased', 'ExtractBased'].includes(questionType)) {
     typeInstructions = `Generate ${questionType} questions.
     - Select a relevant paragraph or case from the text and put it in the 'context' field.
     - Ask a question based on that context.
     - Provide a 'modelAnswer' that yields full marks based on the context.`;
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format from AI. Expected a 'questions' array.");
    }

    // Map and Validate
    const validatedQuestions: QuizQuestion[] = parsed.questions.map((q: any) => ({
        type: questionType, // Enforce the requested type
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || "",
        modelAnswer: q.modelAnswer || "",
        context: q.context || "",
        explanation: q.explanation || ""
    }));

    return validatedQuestions;
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error);
    throw new Error("Failed to generate quiz. The AI model might be unavailable or the content could not be processed.");
  }
}

/**
 * Evaluates a student's uploaded answer image against the model answer.
 */
export async function evaluateAnswer(
  question: string,
  modelAnswer: string,
  imageBase64: string,
  maxMarks: number
): Promise<EvaluationResult> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
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
    } catch (error) {
        console.error("Error evaluating answer:", error);
        throw new Error("Failed to evaluate answer. Please try again.");
    }
}
