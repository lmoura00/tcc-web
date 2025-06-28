"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SignOutButtonProps {
  isExpanded: boolean;
}

export default function SignOutButton({ isExpanded }: SignOutButtonProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await (await supabase).auth.signOut();
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center justify-center p-2 rounded-lg hover:bg-white/10"
    >
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      {isExpanded && <span className="ml-2">Sair</span>}
    </button>
  );
}
