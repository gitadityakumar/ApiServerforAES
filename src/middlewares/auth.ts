import { createClerkClient } from "@clerk/backend";
import dotenv from "dotenv";
import { verifyToken } from "@clerk/backend";
import { jwtDecode } from "jwt-decode";
import { tryCatch } from "bullmq";

dotenv.config();

const KEY = process.env.CLERK_SECRET_KEY;
const JwtKey = process.env.CLERK_JWT_KEY;

const clerkClient = createClerkClient({ secretKey: KEY });

// @ts-ignore
// Function to fetch user by userId
export async function fetchUserById(userId) {
  try {
    // Fetch user by userId
    const user = await clerkClient.users.getUser(userId);

    // Check if the user exists
    if (user) {
      console.log("auth.ts:" + "  User found");
      return user; // Return user data if needed
    } else {
      console.log("User does not exist: frm auth.ts");
      return null;
    }
  } catch (error) {
    if (
      //@ts-ignore
      error.status === 404 &&
      //@ts-ignore
      error.clerkError &&
      //@ts-ignore
      error.errors?.[0]?.message === "not found"
    ) {
      console.error(`User not found: No user was found with id ${userId}`);
    } else {
      // Handle other possible errors
      console.error("An error occurred while fetching the user:", error);
    }
    return null;
  }
}

// Function to verify token from an Authorization header
//@ts-ignore
async function verifyUserToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Invalid or missing authorization header");
  }

  const token = authHeader.split(" ")[1];

  // Check if the token has 3 parts (header, payload, signature)
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    return 0;
  }

  let decoded;
  try {
    // Decode the token to check expiration
    decoded = jwtDecode(token);
  } catch (error) {
    console.log(error)
    return 0;
  }

  // Check if the `exp` field exists and then compare
  if (!decoded.exp) {
    console.log("Token does not have an expiration date")
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  if (decoded.exp < currentTime) {
    console.log("Token is expired")
    return 0;
  }

  try {
    // Verify the extracted token
    const verifiedToken = await verifyToken(token, {
      jwtKey: JwtKey,
      authorizedParties: ["http://localhost:3000", "http://localhost:3003"],
    });
    return verifiedToken;
  } catch (err) {
    console.error("Token verification failed", err);
    return 0;
    // throw new Error('Token verification failed');
  }
}

export default verifyUserToken;
