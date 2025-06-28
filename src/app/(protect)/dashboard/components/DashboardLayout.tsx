"use client";
import { FiHome, FiUsers, FiAward, FiSettings, FiUser } from "react-icons/fi";
import { RiNewspaperLine } from "react-icons/ri";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {Profile as user} from "@/types"

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: user;
}

interface Profile {
  first_name: string;
  last_name: string;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        if (!error && data) setProfile(data);
        else setProfile(null);
      }
      setIsLoadingProfile(false);
    };
    fetchProfile();
  }, [user, supabase]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside
        className={`
          ${isHovered ? 'w-64' : 'w-20'}
          bg-[#149048] text-white flex flex-col transition-all duration-300 ease-in-out shadow-xl
          fixed md:static z-30 h-full
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`py-6 px-4 border-b border-white/10 ${!isHovered ? 'flex justify-center' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
              <FiUser className="text-white text-xl" />
            </div>
            {isHovered && (
              <div className="overflow-hidden">
                {isLoadingProfile ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-32"></div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-bold text-lg truncate">
                      {profile?.first_name && profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : "Usuário"}
                    </h2>
                    <p className="text-sm text-gray-300 truncate">
                      {user?.email || "E-mail não disponível"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {[
            { href: "/dashboard", icon: FiHome, label: "Dashboard" },
            { href: "/dashboard/equipes", icon: FiUsers, label: "Equipes" },
            { href: "/dashboard/competicoes", icon: FiAward, label: "Competições" },
            { href: "/dashboard/sumula", icon: RiNewspaperLine, label: "Súmula" },
            { href: "/dashboard/configuracoes", icon: FiSettings, label: "Configurações" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 p-3 rounded-lg text-white no-underline transition
                ${isActive(item.href)
                  ? 'bg-white/30 font-semibold shadow-inner'
                  : 'hover:bg-white/20'}
                ${!isHovered ? 'justify-center' : ''}
                relative
              `}
            >
              <item.icon className="text-xl flex-shrink-0" />
              <span
                className={`
                  transition-all duration-300
                  ${isHovered ? 'opacity-100 ml-2' : 'opacity-0 w-0 overflow-hidden absolute'}
                `}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className={`mt-auto py-4 px-4 border-t border-white/10 ${!isHovered ? 'flex justify-center' : ''}`}>
          <SignOutButton isExpanded={isHovered} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 ml-20 md:ml-0 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}