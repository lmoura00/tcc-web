"use client";
import { login, LoginState } from "./action"; 
import Image from "next/image";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { useActionState, useEffect, useState } from "react";



type Partida = {
  id: string;
  data: string;
  local?: string;
  equipe_a?: { nome: string };
  equipe_b?: { nome: string };
  competicao?: { nome: string };
};

const LoginPage = () => {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});
  const [proximasPartidas, setProximasPartidas] = useState<Partida[]>([]);

  useEffect(() => {
    fetch("/api/proximas-partidas")
      .then((res) => res.json())
      .then(setProximasPartidas);
  }, []);

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
        <div className="w-full max-w-xs mx-auto mt-8">
          <h3 className="text-lg font-bold text-green-100 mb-2 text-center">
            Próximos Jogos
          </h3>
          {proximasPartidas.length > 0 ? (
            <ul className="space-y-2">
              {proximasPartidas.map((partida) => (
                <li
                  key={partida.id}
                  className="bg-green-50 border border-green-200 rounded p-3 text-left"
                >
                  <div className="font-semibold text-green-900">
                    {partida.equipe_a?.nome}{" "}
                    <span className="mx-1 text-gray-500">vs</span>{" "}
                    {partida.equipe_b?.nome}
                  </div>
                  <div className="text-sm text-gray-700">
                    {partida.competicao?.nome && (
                      <span className="italic">{partida.competicao.nome} • </span>
                    )}
                    {partida.data
                      ? new Date(partida.data).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Data a definir"}
                    {partida.local && <span> • {partida.local}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-green-100 text-sm text-center">
              Nenhuma partida futura agendada.
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
