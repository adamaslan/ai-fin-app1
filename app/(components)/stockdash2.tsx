import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

// Define the function to get all users
export const getAlldata = async () => {
  try {
    // Fetch all users from the "mytable" table
    const alldata = await prisma.stock_data.findMany();
    return alldata;
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
  const nudata = await prisma.stock_data.findMany({
    select: {
    //add data
    }
  })
return new Response(JSON.stringify(nudata), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
  },
})
}