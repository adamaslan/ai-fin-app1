import { auth } from "@/auth-node";

export default async function MePage() {
  const session = await auth();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">My Session</h1>
      <pre className="mt-4 bg-gray-900 text-white p-4 rounded">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
