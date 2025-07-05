"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface ModalityItem {
  id: string;
  name: string;
}

interface CompetitionModalitiesFormProps {
  initialModalidades: string[] | null;
}

export function CompetitionModalitiesForm({ initialModalidades }: CompetitionModalitiesFormProps) {
  const [modalities, setModalities] = useState<ModalityItem[]>([]);
  const [newModalityInput, setNewModalityInput] = useState('');

  useEffect(() => {
    if (initialModalidades) {
      // Cria um Set para garantir nomes únicos e depois mapeia para ModalityItem com IDs únicos
      const uniqueNames = new Set(initialModalidades);
      setModalities(Array.from(uniqueNames).map(name => ({ id: crypto.randomUUID(), name })));
    } else {
      setModalities([]);
    }
  }, [initialModalidades]);

  const handleAddModality = () => {
    const trimmedInput = newModalityInput.trim();
    if (trimmedInput === '') {
      toast.error("O nome da modalidade não pode ser vazio.");
      return;
    }
    // Verifica por duplicatas pelo nome (case-insensitive)
    if (modalities.some(m => m.name.toLowerCase() === trimmedInput.toLowerCase())) {
      toast.error("Essa modalidade já está na lista.");
      return;
    }

    // Adiciona nova modalidade com um ID único
    setModalities(prev => [...prev, { id: crypto.randomUUID(), name: trimmedInput }]);
    setNewModalityInput('');
    toast.success(`Modalidade "${trimmedInput}" adicionada. Salve para aplicar.`);
  };

  // Adaptação: agora recebe o ID da modalidade para remover/desmarcar
  const handleCheckboxChange = (modalityIdToToggle: string, isChecked: boolean) => {
    setModalities(prev => {
      // Se desmarcado, remove a modalidade da lista usando seu ID único
      if (!isChecked) {
        const removedModality = prev.find(m => m.id === modalityIdToToggle);
        if (removedModality) {
          toast.success(`Modalidade "${removedModality.name}" desmarcada. Salve para aplicar.`);
        }
        return prev.filter(m => m.id !== modalityIdToToggle);
      }
      // Se marcado, não faz nada, pois as modalidades são adicionadas via input e já vêm marcadas
      return prev;
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Modalidades*
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {modalities.length > 0 ? (
          modalities.map((modality) => (
            <div key={modality.id} className="flex items-center">
              <input
                type="checkbox"
                id={`modality-${modality.id}`}
                name="modalidades"
                value={modality.name}
                checked={true} // Sempre marcado se estiver no estado 'modalities'
                onChange={(e) => handleCheckboxChange(modality.id, e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor={`modality-${modality.id}`} className="ml-2 block text-sm text-gray-700">
                {modality.name}
              </label>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full">Nenhuma modalidade adicionada ainda.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Adicionar nova modalidade"
          value={newModalityInput}
          onChange={(e) => setNewModalityInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddModality();
            }
          }}
          className="flex-1"
        />
        <Button type="button" onClick={handleAddModality} disabled={newModalityInput.trim() === ''}>
          Adicionar
        </Button>
      </div>
      {/* Inputs ocultos para garantir que todas as modalidades no estado sejam enviadas pelo nome.
          Como o 'handleSubmit' do server agora usa um Set, duplicatas aqui serão ignoradas. */}
      {modalities.map((modality) => (
        <input key={`hidden-${modality.id}`} type="hidden" name="modalidades" value={modality.name} />
      ))}
    </div>
  );
}
