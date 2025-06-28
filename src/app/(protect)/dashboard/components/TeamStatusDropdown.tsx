"use client"

import { useState, useTransition } from 'react';
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTeamStatus } from "../competicoes/action";
import { toast } from "sonner";

export function TeamStatusDropdown({ 
  teamId, 
  currentStatus 
}: { 
  teamId: string, 
  currentStatus: string 
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (newStatus: 'aprovado' | 'reprovado' | 'pendente') => {
    startTransition(async () => {
      try {
        await updateTeamStatus(teamId, newStatus);
        setStatus(newStatus);
        toast.success(`Status atualizado para ${newStatus}`);
      } catch (error) {
        toast.error("Falha ao atualizar status");
        console.error("Failed to update team status:", error);
      }
    });
  };

  const handleChange = async (status: string) => {
    if (status === "reprovado") {
      const feedback = prompt("Digite o motivo da recusa para o responsável:");
      if (!feedback) return;
      await fetch("/api/equipe/recusar", {
        method: "POST",
        body: JSON.stringify({ teamId, feedback }),
        headers: { "Content-Type": "application/json" },
      });
    }
    handleStatusUpdate(status as 'aprovado' | 'reprovado' | 'pendente');
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600"
            disabled={isPending}
          >
            {status === 'aprovado' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : status === 'reprovado' ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
            {isPending && <span className="ml-2">...</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem 
            onClick={() => handleChange('aprovado')}
            className="flex items-center gap-2 text-green-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            Aprovar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleChange('reprovado')}
            className="flex items-center gap-2 text-red-600"
          >
            <XCircle className="h-4 w-4" />
            Reprovar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleChange('pendente')}
            className="flex items-center gap-2 text-yellow-600"
          >
            <Clock className="h-4 w-4" />
            Pendente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}