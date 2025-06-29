import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

// Define the function to get all users
export const getAllUsers = async () => {
  try {
    // Fetch all users from the "mytable" table
    const allUsers = await prisma.stock_data.findMany();
    return allUsers;
  } catch (error) {
    // Handle any potential errors
    console.error("Error fetching users:", error);
    throw error; // Re-throw the error so it can be caught elsewhere
  } finally {
    // Ensure the Prisma client disconnects to free up resources
    await prisma.$disconnect();
  }
};

export default async function handler(req: Request, res: Response) {
  const artworks = await prisma.stock_data.findMany({
    select: {
      id: true,
      artist: true,
      medium1: true,
      medium2: true
    }
  })
return new Response(JSON.stringify(artworks), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
  },
})
}