"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteMatch } from "./action";

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={async (formData) => {
        await deleteMatch(formData);
        startTransition(() => {
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="id" value={matchId} />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        className="text-red-600 hover:bg-red-50"
        title="Apagar partida"
        disabled={isPending}
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </form>
  );
}