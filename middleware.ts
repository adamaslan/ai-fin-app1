import { authEdge } from "@/auth-edge";

export default authEdge;

export const config = {
  matcher: ["/dashboard/:path*", "/api/private/:path*"], // adjust paths as needed
};
