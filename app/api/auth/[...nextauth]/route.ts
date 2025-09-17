export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authNode } from "@/auth-node";

export const { GET, POST } = authNode.handlers;
