// import SignIn from "@/components/sign-in"
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center">
   <SignIn forceRedirectUrl="/Dashboard2"  
   
   />
   
    </div>
  )
}
