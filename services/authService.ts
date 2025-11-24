
import { User } from '../types';

const USERS_DB_KEY = 'quizAppUsersDB'; // Stores array of all users
const USER_SESSION_KEY = 'quizAppUserSession'; // Stores the currently logged-in user

// Helper to get all users from our mock DB
function getUsersDB(): (User & { passwordHash: string })[] {
  try {
    const usersJSON = localStorage.getItem(USERS_DB_KEY);
    return usersJSON ? JSON.parse(usersJSON) : [];
  } catch (e) {
    return [];
  }
}

// Helper to save all users to our mock DB
function saveUsersDB(users: (User & { passwordHash: string })[]): void {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

/**
 * Signs up a new user.
 * @param name The user's name.
 * @param email The user's email.
 * @param password The user's password.
 * @returns A promise that resolves to the new User object.
 */
export async function signUp(name: string, email: string, password: string): Promise<User> {
    const users = getUsersDB();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
        throw new Error("An account with this email already exists.");
    }
    
    // In a real app, you would hash the password. Here we store it directly for simplicity.
    const newUser: User = {
        id: `user_${new Date().getTime()}`,
        name,
        email,
        picture: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };

    const userForDb = { ...newUser, passwordHash: password }; // Storing plain text password as hash for this mock.
    users.push(userForDb);
    saveUsersDB(users);
    
    // Automatically sign in the new user
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));

    return new Promise(resolve => setTimeout(() => resolve(newUser), 500));
}

/**
 * Signs in an existing user.
 * @param email The user's email.
 * @param password The user's password.
 * @returns A promise that resolves to the User object.
 */
export async function signIn(email: string, password: string): Promise<User> {
    const users = getUsersDB();
    const userInDb = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!userInDb || userInDb.passwordHash !== password) {
        throw new Error("Invalid email or password.");
    }
    
    // Don't include password in the session object
    const sessionUser: User = {
        id: userInDb.id,
        name: userInDb.name,
        email: userInDb.email,
        picture: userInDb.picture,
    };
    
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionUser));

    return new Promise(resolve => setTimeout(() => resolve(sessionUser), 500));
}

/**
 * Signs the user out by clearing their session from localStorage.
 */
export function signOut(): void {
  localStorage.removeItem(USER_SESSION_KEY);
}

/**
 * Retrieves the current user from localStorage if a session exists.
 * @returns The User object or null if not logged in.
 */
export function getCurrentUser(): User | null {
  try {
    const userJSON = localStorage.getItem(USER_SESSION_KEY);
    if (!userJSON) {
      return null;
    }
    return JSON.parse(userJSON) as User;
  } catch (error) {
    console.error("Failed to retrieve user from localStorage:", error);
    return null;
  }
}
