// app/cadastro/action.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type FormState = {
  message: string;
  errors?: Record<string, string>;
};

export async function registerUser(prevState: FormState, formData: FormData): Promise<FormState> {
  // Extrair dados do formulário
  const email = formData.get('email') as string;
  const first_name = formData.get('first_name') as string;
  const last_name = formData.get('last_name') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const photoFile = formData.get('photo') as File | null;

  // Validações básicas
  const errors: Record<string, string> = {};

  if (!email.includes('@')) {
    errors.email = 'E-mail inválido';
  }

  if (password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'As senhas não coincidem';
  }

  if (Object.keys(errors).length > 0) {
    return { message: 'Corrija os erros no formulário', errors };
  }

  let photo_url = null;

  try {
    // Upload da imagem para o imgBB (se existir)
    if (photoFile && photoFile.size > 0) {
      const imgbbFormData = new FormData();
      imgbbFormData.append('image', photoFile);

      const imgbbResponse = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', {
        method: 'POST',
        body: imgbbFormData,
      });

      const imgbbData = await imgbbResponse.json();

      if (imgbbData.success) {
        photo_url = imgbbData.data.url;
      } else {
        console.error('Erro no upload da imagem:', imgbbData);
      }
    }

    // Criar usuário no Supabase
    const supabase = createClient();

    // 1. Registrar usuário no sistema de autenticação
    const { data: authData, error: authError } = await (await supabase).auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // 2. Criar perfil na tabela profiles
    const { error: profileError } = await (await supabase)
      .from('profiles')
      .insert([
        {
          id: authData.user?.id,
          email,
          first_name,
          last_name,
          photo_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      throw new Error(profileError.message);
    }
    (await supabase).auth.updateUser({data:{name: first_name + ' ' + last_name, phoyo_url: photo_url}});
    return { 
      message: 'Cadastro realizado com sucesso! Redirecionando...',
    };
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return { 
      message: error instanceof Error ? error.message : 'Ocorreu um erro durante o cadastro',
      errors: {} 
    };
  } finally {
    // Redirecionar após sucesso
    if (!errors) {
      redirect('/login');
    }
  }
}