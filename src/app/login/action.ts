"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  const { error } = await (
    await supabase
  ).auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let errorMessage = "Falha no login. Verifique suas credenciais.";

    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "E-mail não confirmado. Verifique sua caixa de entrada.";
    } else if (error.message.includes("Too many requests")) {
      errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
    }

    return { error: errorMessage };
  }

  // Sempre retorna um objeto, mesmo após o redirect
  redirect("/dashboard");
  return {}; // <- Adicione esta linha para garantir o tipo
}
