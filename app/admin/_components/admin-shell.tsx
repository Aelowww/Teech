"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LayoutDashboard, LogOut, UsersRound, type LucideIcon } from "lucide-react";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/admin";
import styles from "./console.module.css";

const idleLimit = 15 * 60 * 1000;

type Pending = { student: number; faculty: number };

const navItems: { href: string; label: string; Icon: LucideIcon; badge?: keyof Pending }[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", Icon: GraduationCap, badge: "student" },
  { href: "/admin/faculty", label: "Faculty", Icon: UsersRound, badge: "faculty" },
];

const AdminContext = createContext<{ name: string }>({ name: "Admin" });

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("Admin");
  const [pending, setPending] = useState<Pending>({ student: 0, faculty: 0 });
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const lastActivity = useRef(0);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    router.replace("/welcome");
    router.refresh();
  }, [router]);

  const loadPending = useCallback(async () => {
    const supabase = createClient();
    const countFor = (role: keyof Pending) => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending").eq("role", role);
    const [students, faculty] = await Promise.all([countFor("student"), countFor("faculty")]);
    setPending({ student: students.count ?? 0, faculty: faculty.count ?? 0 });
  }, []);

  useEffect(() => {
    let active = true;
    async function check() {
      const supabase = createClient();
      const { data: status } = await supabase.rpc("my_admin_status");
      if (!active) return;
      if (status !== "ok") {
        router.replace("/admin/sign-in");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user ? await supabase.from("profiles").select("full_name").eq("auth_user_id", user.id).maybeSingle() : { data: null };
      if (!active) return;
      if (profile?.full_name) setName(profile.full_name);
      await loadPending();
      if (active) setReady(true);
    }
    void check();
    return () => { active = false; };
  }, [router, loadPending]);

  useRealtimeRefresh("profiles", loadPending);

  useEffect(() => {
    lastActivity.current = Date.now();
    const touch = () => { lastActivity.current = Date.now(); };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, touch, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current > idleLimit) void signOut();
    }, 30000);
    return () => {
      events.forEach((event) => window.removeEventListener(event, touch));
      window.clearInterval(timer);
    };
  }, [signOut]);

  if (!ready) return <AppLoader />;

  return (
    <AdminContext.Provider value={{ name }}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <Link className={styles.brand} href="/admin">
            <Image className={styles.brandLogo} src="/logo/teech_logo.svg" alt="Teech" width={1118} height={348} priority />
            <span className={styles.brandTag}>Admin</span>
          </Link>

          <nav className={styles.nav} aria-label="Admin navigation">
            {navItems.map(({ href, label, Icon, badge }) => {
              const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`${styles.navItem} ${active ? styles.navActive : ""}`} aria-current={active ? "page" : undefined}>
                  <Icon size={19} />
                  <span>{label}</span>
                  {badge && pending[badge] > 0 && <b className={styles.navBadge} aria-label={`${pending[badge]} pending`}>{pending[badge]}</b>}
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.profileCard}>
              <span className={styles.avatar}>{name.trim().charAt(0).toUpperCase() || "A"}</span>
              <div>
                <strong>{name}</strong>
                <small>Administrator</small>
              </div>
            </div>
            <button className={styles.signOut} type="button" onClick={() => setConfirmingSignOut(true)}><LogOut size={18} /><span>Sign out</span></button>
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
        <ConfirmationModal open={confirmingSignOut} title="Are you sure you want to sign out?" description="You'll need your email, password, and authenticator code to sign back in." confirmLabel="Sign Out" icon={LogOut} onCancel={() => setConfirmingSignOut(false)} onConfirm={signOut} />
      </div>
    </AdminContext.Provider>
  );
}
