"use client";
import { useActionState } from "react";
import { login } from "./action";
import Image from "next/image";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";

const LoginPage = () => {
  const [state, formAction] = useActionState(login, { error: "" });

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-100">
      <div className="w-full md:w-3/4 bg-white flex flex-col items-center justify-center text-center px-4 py-8 md:py-0">
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-[90vw] sm:max-w-[620px]">
            <Image
              src="/assets/logo.jpg"
              alt="Logo IFMA"
              width={620}
              height={420}
              className="mb-4 w-full h-auto object-contain"
              priority
            />
          </div>
          <div className="w-full max-w-[60vw] sm:max-w-[200px]">
            <Image
              src="/assets/image 2.png"
              alt="Logo IFMA"
              width={200}
              height={200}
              className="mb-2 w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
      <form
        action={formAction}
        className="w-full md:w-1/4 min-w-fit bg-green-700 flex flex-col justify-center items-center px-4 py-8 sm:p-8"
      >
        <h2 className="text-white text-2xl font-bold tracking-widest mb-8">
          LOGIN
        </h2>
        {state?.error && (
          <div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center text-sm">
            {state.error}
          </div>
        )}
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          required
          className="w-full max-w-xs bg-white p-3 mb-4 rounded shadow text-center text-base focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <input
          type="password"
          name="password"
          placeholder="Senha"
          required
          className="w-full max-w-xs p-3 bg-white mb-6 rounded shadow text-center text-base focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <div className="flex flex-col w-full max-w-xs gap-4">
          <SubmitButton />
          <Link
            href="/cadastrarEquipe"
            className="w-full bg-white hover:bg-green-600 hover:text-white text-green-700 font-bold py-2 px-6 rounded shadow transition-colors text-center block"
          >
            CADASTRAR EQUIPE
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
