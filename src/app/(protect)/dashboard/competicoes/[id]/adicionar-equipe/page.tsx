"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { use } from "react"; // Import the use hook

type Equipe = {
  id: string;
  nome: string;
  membros: number;
  modalidade: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_turma: string;
  created_at: string;
  status: string;
};


type PageParams = {
  id: string;
};


type PageProps = {
  params: Promise<PageParams>;
};

export default function AdicionarEquipePage({ params }: PageProps) {

  const { id } = use(params);

  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("nova");
  const [nome, setNome] = useState("");
  const [membros, setMembros] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [equipesExistentes, setEquipesExistentes] = useState<Equipe[]>([]);
  const [selectedEquipes, setSelectedEquipes] = useState<string[]>([]);

  const loadEquipesExistentes = async () => {
    const { data, error } = await supabase
      .from("equipes")
      .select(
        "id, nome, modalidade, responsavel_nome, responsavel_email, responsavel_turma, created_at, status"
      )
      .or(`competicao_id.is.null,competicao_id.eq.${id}`);

    if (error) {
      console.error("Erro ao buscar equipes:", error);
      return;
    }

    if (data) {
      setEquipesExistentes(data.filter((e) => e.competicao_id !== id));
    }
  };

  const handleSubmitNovaEquipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from("equipes").insert({
      nome,
      membros,
      competicao_id: id, 
      criado_em: new Date().toISOString(),
    });

    if (error) {
      alert("Erro ao cadastrar equipe: " + error.message);
    } else {
      router.push(`/dashboard/competicoes/${id}`); 
    }
    setIsLoading(false);
  };

  const handleSubmitEquipesExistentes = async () => {
    setIsLoading(true);

    const { error } = await supabase
      .from("equipes")
      .update({ competicao_id: id }) 
      .in("id", selectedEquipes);

    if (error) {
      alert("Erro ao adicionar equipes: " + error.message);
    } else {
      router.push(`/dashboard/competicoes/${id}`); 
    }
    setIsLoading(false);
  };

  const toggleEquipeSelection = (id: string) => {
    setSelectedEquipes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        Adicionar Equipes à Competição
      </h1>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nova" onClick={() => setActiveTab("nova")}>
            Nova Equipe
          </TabsTrigger>
          <TabsTrigger
            value="existente"
            onClick={() => {
              setActiveTab("existente");
              loadEquipesExistentes();
            }}
          >
            Equipes Existentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nova">
          <form onSubmit={handleSubmitNovaEquipe} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Equipe</Label>
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="membros">Membros (separados por vírgula)</Label>
              <Input
                id="membros"
                type="text"
                value={membros}
                onChange={(e) => setMembros(e.target.value)}
                required
                placeholder="João, Maria, Carlos"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Equipe"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="existente">
          {equipesExistentes.length === 0 ? (
            <p className="text-gray-500 mb-4">
              Nenhuma equipe disponível para adicionar
            </p>
          ) : (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-2">
                {equipesExistentes.map((equipe) => (
                  <div
                    key={equipe.id}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded"
                  >
                    <Checkbox
                      id={`equipe-${equipe.id}`}
                      checked={selectedEquipes.includes(equipe.id)}
                      onCheckedChange={() => toggleEquipeSelection(equipe.id)}
                    />
                    <label
                      htmlFor={`equipe-${equipe.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{equipe.nome}</div>
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Modalidade:</strong> {equipe.modalidade}
                        </p>
                        <p>
                          <strong>Responsável:</strong>{" "}
                          {equipe.responsavel_nome} ({equipe.responsavel_email})
                        </p>
                        <p>
                          <strong>Turma:</strong> {equipe.responsavel_turma}
                        </p>
                        <p>
                          <strong>Status:</strong> {equipe.status}
                        </p>
                        <p>
                          <strong>Data de criação:</strong>{" "}
                          {new Date(equipe.created_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitEquipesExistentes}
                  disabled={isLoading || selectedEquipes.length === 0}
                >
                  {isLoading
                    ? "Adicionando..."
                    : `Adicionar (${selectedEquipes.length})`}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
