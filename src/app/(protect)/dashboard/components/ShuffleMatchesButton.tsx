"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

export function ShuffleMatchesButton({ action }: { action: (prevState: any, formData: FormData) => Promise<any> }) {
  const [state, formAction] = useActionState(action, {
    error: null,
    success: null,
  });

  return (
    <>
      <form action={formAction}>
        <ShuffleButton />
      </form>
      {state?.error && (
        <p className="text-red-500 text-sm mt-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-500 text-sm mt-2">{state.success}</p>
      )}
    </>
  );
}

function ShuffleButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="default"
      size="sm"
      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
      disabled={pending}
    >
      <Shuffle className="h-4 w-4" />
      {pending ? "Sorteando..." : "Sortear"}
    </Button>
  );
}