
import { QuizQuestion, SavedQuiz, User } from '../types';

const STORAGE_KEY = 'communityQuizzes';

/**
 * Retrieves all saved quizzes from localStorage.
 * @returns An array of SavedQuiz objects.
 */
export function getQuizzes(): SavedQuiz[] {
  try {
    const quizzesJSON = localStorage.getItem(STORAGE_KEY);
    if (!quizzesJSON) {
      return [];
    }
    const quizzes = JSON.parse(quizzesJSON);
    return Array.isArray(quizzes) ? quizzes : [];
  } catch (error) {
    console.error("Failed to retrieve quizzes from localStorage:", error);
    return [];
  }
}

/**
 * Retrieves all saved quizzes by a specific creator.
 * @param userId The ID of the user.
 * @returns An array of SavedQuiz objects created by that user.
 */
export function getQuizzesByCreator(userId: string): SavedQuiz[] {
    const allQuizzes = getQuizzes();
    return allQuizzes.filter(quiz => quiz.creatorId === userId);
}

/**
 * Saves a newly generated quiz to localStorage.
 * @param quizName The name of the quiz.
 * @param questions An array of QuizQuestion objects.
 * @param user The user creating the quiz.
 * @param difficulty The difficulty setting of the quiz.
 * @param timeLimit The time limit in minutes (0 if none).
 */
export function saveQuiz(
  quizName: string, 
  questions: QuizQuestion[], 
  user: User,
  difficulty: string = 'Mixed',
  timeLimit: number = 0
): void {
  try {
    const quizzes = getQuizzes();
    const newQuiz: SavedQuiz = {
      id: `quiz_${new Date().getTime()}`,
      name: quizName,
      questions: questions,
      creatorId: user.id,
      creatorName: user.name,
      difficulty,
      timeLimit
    };
    quizzes.unshift(newQuiz); // Add new quiz to the beginning of the list
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
  } catch (error) {
    console.error("Failed to save quiz to localStorage:", error);
  }
}
