'use client';

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import { shuffleMatches } from "@/app/(protect)/dashboard/competicoes/[id]/action";

export function ShuffleMatchesButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      const result = await shuffleMatches(id);
      if (result?.error) {
        setMessage(`Erro: ${result.error}`);
      } else {
        setMessage(result.success || "Partidas sorteadas com sucesso!");
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={handleClick}
        disabled={isPending}
      >
        <Shuffle className="h-4 w-4" />
        {isPending ? "Sorteando..." : "Sortear Partidas"}
      </Button>

      {message && (
        <span className="text-sm text-gray-700 mt-1 sm:mt-0">{message}</span>
      )}
    </div>
  );
}
