"use client";

import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";
import { shuffleMatches } from "../competicoes/action";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ShuffleMatchesButtonProps {
  id: string;
}

export function ShuffleMatchesButton({ id }: ShuffleMatchesButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleShuffle = async () => {
    setIsLoading(true);
    try {
      const result = await shuffleMatches(id);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      }

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning) => {
          toast.warning(warning);
        });
      }
    } catch (e) {
      console.error("Erro ao chamar a action de sortear:", e);
      toast.error("Ocorreu um erro inesperado ao sortear as partidas.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={handleShuffle}
      disabled={isLoading}
    >
      <Shuffle className="h-4 w-4" />
      {isLoading ? "Sorteando..." : "Sortear Partidas"}
    </Button>
  );
}