'use client';

import { useActionState, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import {  useFormStatus } from 'react-dom';
import { registerUser } from './action';


export default function Cadastro() {
  const [state, formAction] = useActionState(registerUser, { 
    message: '', 
    errors: {} 
  });
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { pending } = useFormStatus();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo */}
      <div className="w-2/3 bg-white flex flex-col items-center justify-center text-center align-middle px-8">
        <Image
          src="/assets/logo.jpg"
          alt="Logo IFMA"
          width={620}
          height={420}
          className="mb-2"
        />
        <Image
          src="/assets/image 2.png"
          alt="Logo IFMA"
          width={200}
          height={200}
          className="mb-2"
        />
      </div>

      {/* Lado direito - Cadastro */}
      <div className="w-1/2 bg-green-700 flex flex-col justify-center items-center p-8">
        <h2 className="text-white text-2xl font-bold mb-6">CADASTRO</h2>
        
        {state?.message && (
          <div className={`mb-4 p-2 rounded ${
            state.message.includes('sucesso') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {state.message}
          </div>
        )}

        <form action={formAction} className="flex flex-col items-center space-y-4 w-full max-w-sm">
          <div className="w-full">
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              className="w-full p-3 rounded shadow text-center text-sm bg-white"
              required
            />
            {state?.errors?.email && (
              <p className="text-red-100 text-xs mt-1">{state.errors.email}</p>
            )}
          </div>

          <div className="w-full">
            <input
              type="text"
              name="first_name"
              placeholder="Nome"
              className="w-full p-3 rounded shadow text-center text-sm bg-white"
              required
            />
            {state?.errors?.first_name && (
              <p className="text-red-100 text-xs mt-1">{state.errors.first_name}</p>
            )}
          </div>

          <div className="w-full">
            <input
              type="text"
              name="last_name"
              placeholder="Sobrenome"
              className="w-full p-3 rounded shadow text-center text-sm bg-white"
              required
            />
            {state?.errors?.last_name && (
              <p className="text-red-100 text-xs mt-1">{state.errors.last_name}</p>
            )}
          </div>

          <div className="w-full">
            <input
              type="password"
              name="password"
              placeholder="Senha"
              className="w-full p-3 rounded shadow text-center text-sm bg-white"
              required
              minLength={6}
            />
            {state?.errors?.password && (
              <p className="text-red-100 text-xs mt-1">{state.errors.password}</p>
            )}
          </div>

          <div className="w-full">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmação de senha"
              className="w-full p-3 rounded shadow text-center text-sm bg-white"
              required
            />
            {state?.errors?.confirmPassword && (
              <p className="text-red-100 text-xs mt-1">{state.errors.confirmPassword}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-white text-sm mb-2">Foto de Perfil (Opcional)</label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-white text-sm"
              disabled={isUploading}
            />
            {isUploading && <p className="text-white text-xs mt-1">Carregando imagem...</p>}
            
            {previewImage && (
              <div className="mt-2">
                <Image
                  src={previewImage}
                  alt="Preview da imagem"
                  width={100}
                  height={100}
                  className="rounded-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex space-x-4 mt-6">
            <button 
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded shadow"
              disabled={pending || isUploading}
            >
              {pending ? 'CADASTRANDO...' : 'CADASTRAR'}
            </button>
            <Link
              href="/login"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded shadow"
            >
              CANCELAR
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}