import { Storage } from "@google-cloud/storage";

// Validate environment variables exist
if (!process.env.GCP_PROJECT_ID) {
  console.warn("GCP_PROJECT_ID environment variable is not set");
}

if (!process.env.GCP_CREDENTIALS) {
  console.warn("GCP_CREDENTIALS environment variable is not set");
}

// Initialize Storage with proper credential handling for Vercel
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || "dfl1",
  credentials: process.env.GCP_CREDENTIALS 
    ? JSON.parse(process.env.GCP_CREDENTIALS)
    : undefined
});

const BUCKET_NAME = "ttb-bucket1";

// Test connection function with secure error handling
async function testBucketAccess() {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();
    console.log(`Bucket ${BUCKET_NAME} exists: ${exists}`);
    return exists;
  } catch (error) {
    // Only log error type, not full details that might contain credentials
    console.error("Error accessing bucket:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

// Optional: Add type safety for credentials
interface GCPCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// For testing - you can call this in your page component
// Then check the server logs in Vercel or your terminal
async function testConnectionOnLoad() {
  const canAccess = await testBucketAccess();
  if (!canAccess) {
    console.error("Failed to access GCS bucket - check credentials");
  }
  return canAccess;
}

export { storage, BUCKET_NAME, testBucketAccess, testConnectionOnLoad };