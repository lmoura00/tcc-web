import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ConfiguracoesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await (await supabase)
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  async function updateProfile(formData: FormData) {
    "use server";
    try {
      const supabase = createClient();
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;
      const email = formData.get("email") as string;
      const photoFile = formData.get("photo") as File;
      let photoUrl = profile?.photo_url || null;
      if (photoFile.size > 0) {
        const imgbbFormData = new FormData();
        imgbbFormData.append("image", photoFile);
        const imgbbResponse = await fetch(
          "https://api.imgbb.com/1/upload?key=SUA_CHAVE_API",
          { method: "POST", body: imgbbFormData }
        );
        const imgbbData = await imgbbResponse.json();
        photoUrl = imgbbData.data.url;
      }
      if (email !== user?.email) {
        const { error: emailError } = await (
          await supabase
        ).auth.updateUser({ email });
        if (emailError) throw new Error(emailError.message);
      }
      const { error: profileError } = await (await supabase)
        .from("profiles")
        .upsert({
          id: user?.id,
          email,
          first_name: firstName,
          last_name: lastName,
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        });
      if (profileError) throw new Error(profileError.message);
      revalidatePath("/configuracoes");
      return;
    } catch (error) {
      return;
    }
  }

  return (
    <div>
      <section className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold text-gray-700 mb-6">
          Configurações
        </h1>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-medium text-gray-800">
              Perfil do Usuário
            </h2>
            <p className="text-gray-600 mt-2">
              Gerencie suas informações pessoais
            </p>
            <form action={updateProfile} className="mt-4 space-y-4">
              <div className="flex items-center space-x-4">
                {profile?.photo_url ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center">
                    <img
                      src={profile.photo_url}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Sem foto</span>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="photo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Alterar foto
                  </label>
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    accept="image/*"
                    className="mt-1 block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    defaultValue={profile?.first_name || ""}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    defaultValue={profile?.last_name || ""}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  defaultValue={user.email}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-medium text-gray-800">
              Preferências do Sistema
            </h2>
            <p className="text-gray-600 mt-2">
              Configure as preferências do dashboard
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-800">Segurança</h2>
            <p className="text-gray-600 mt-2">
              Altere sua senha e configurações de segurança
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
