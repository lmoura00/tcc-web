"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateMatchDateAndLocal } from "./action";

export function MatchEditForm({ partida }: { partida: { id: string; data: string | null; local: string | null } }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div>
        {partida.data
          ? new Date(partida.data).toLocaleString("pt-BR")
          : "Sem data"}
        {partida.local && ` - ${partida.local}`}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ml-2"
          onClick={() => setEditing(true)}
        >
          Editar
        </Button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateMatchDateAndLocal(formData);
        setEditing(false);
        startTransition(() => {
          router.refresh();
        });
      }}
      className="flex gap-2 items-center"
    >
      <input type="hidden" name="id" value={partida.id} />
      <input
        type="datetime-local"
        name="data"
        className="border rounded px-2 py-1"
        defaultValue={partida.data ? new Date(partida.data).toISOString().slice(0, 16) : ""}
        required
      />
      <input
        type="text"
        name="local"
        className="border rounded px-2 py-1"
        placeholder="Local"
        defaultValue={partida.local || ""}
        required
      />
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        Salvar
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setEditing(false)}
        disabled={isPending}
      >
        Cancelar
      </Button>
    </form>
  );
}