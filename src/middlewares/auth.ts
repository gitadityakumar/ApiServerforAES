import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

dotenv.config();

const KEY = process.env.CLERK_SECRET_KEY;

const clerkClient = createClerkClient({ secretKey: KEY });

// @ts-ignore
// Function to fetch user by userId
export async function fetchUserById(userId) {
  try {
    // Fetch user by userId
    const user = await clerkClient.users.getUser(userId);

    // Check if the user exists
    if (user) {
      console.log('log from auth.ts'+'  User found');
      return user; // Return user data if needed
    } else {
      console.log('User does not exist: frm auth.ts');
      return null;
    }
  } catch (error) {
    // Check for specific "User not found" error (status 404)
    //@ts-ignore
    if (error.status === 404 && error.clerkError && error.errors?.[0]?.message === 'not found') {
      console.error(`User not found: No user was found with id ${userId}`);
    } else {
      // Handle other possible errors
      console.error('An error occurred while fetching the user:', error);
    }
    return null;
  }
}




