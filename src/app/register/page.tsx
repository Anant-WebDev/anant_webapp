import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegisterForm from "@/components/auth/Register";
import MathSymbols from "@/components/floating/MathSymbols";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-white">
      <Navbar />
      <MathSymbols></MathSymbols>

      <main className="flex-grow flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-primary-purple/10 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <RegisterForm />
        </div>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
