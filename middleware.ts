// import { authEdge } from "@/auth-edge";
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

// export default authEdge;

// export const config = {
//   matcher: ["/dashboard/:path*", "/api/private/:path*"], // adjust paths as needed
// };

