"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, CalendarCheck, Coins, Snowflake } from "lucide-react";
import { MobileLayout, Notice, PageHeading } from "@/app/mobile/_components/ui";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { ShowMoreButton, useShowMore } from "@/app/mobile/_components/show-more";
import { badgeIcons } from "@/app/mobile/_components/badge-icons";
import { createClient } from "@/lib/supabase/client";
import styles from "./points-shop.module.css";
import { AppLoader } from "@/app/mobile/_components/app-loader";

type ShopItem = { id: string; name: string; description: string; cost: number; kind: "freeze" | "badge"; badge_id: string | null; max_owned: number };
type LedgerEntry = { amount: number; reason: string; created_at: string };

export function PointsShop({ role }: { role: "student" | "faculty" }) {
  const router = useRouter();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [freezes, setFreezes] = useState(0);
  const [ownedBadges, setOwnedBadges] = useState<string[]>([]);
  const [redeeming, setRedeeming] = useState<ShopItem | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace(`/${role}/sign-in`); return; }
    const [itemsResult, ledgerResult, freezeResult, badgesResult] = await Promise.all([
      supabase.from("shop_items").select("id, name, description, cost, kind, badge_id, max_owned").order("sort_order"),
      supabase.from("points_ledger").select("amount, reason, created_at").order("created_at", { ascending: false }),
      supabase.from("streak_freezes").select("available").maybeSingle(),
      supabase.from("user_badges").select("badge_id"),
    ]);
    if (itemsResult.error || ledgerResult.error) {
      setError(itemsResult.error?.message || ledgerResult.error?.message || "Points could not be loaded.");
    } else {
      setItems((itemsResult.data || []) as ShopItem[]);
      setLedger((ledgerResult.data || []) as LedgerEntry[]);
      setFreezes(freezeResult.data?.available || 0);
      setOwnedBadges((badgesResult.data || []).map((row) => row.badge_id as string));
    }
    setIsLoading(false);
  }, [role, router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  const history = useShowMore(ledger);

  if (isLoading) return <AppLoader />;

  const balance = ledger.reduce((total, entry) => total + entry.amount, 0);

  async function redeem() {
    if (!redeeming) return;
    const { error: redeemError } = await createClient().rpc("redeem_shop_item", { requested_item_id: redeeming.id });
    if (redeemError) return redeemError.message;
    setNotice(`${redeeming.name} redeemed!`);
    await load();
  }

  function itemState(item: ShopItem) {
    if (item.kind === "badge" && item.badge_id && ownedBadges.includes(item.badge_id)) return { label: "Owned", disabled: true };
    if (item.kind === "freeze" && freezes >= item.max_owned) return { label: `Max ${item.max_owned}`, disabled: true };
    if (balance < item.cost) return { label: `${item.cost - balance} more`, disabled: true };
    return { label: "Redeem", disabled: false };
  }

  return (
    <MobileLayout className={styles.screen} backTo={`/${role}/home`} role={role} activeNav="home">
      <div className={styles.page}>
        <PageHeading title="Points" subtitle="Earn points by showing up. Spend them on rewards." />

        <section className={styles.balance}>
          <span><Coins size={22} /></span>
          <div>
            <small>Your balance</small>
            <strong>{balance} <em>pts</em></strong>
          </div>
          {freezes > 0 && <p><Snowflake size={12} />{freezes} {freezes === 1 ? "freeze" : "freezes"} ready</p>}
        </section>

        {error && <Notice error>{error}</Notice>}
        {notice && <Notice>{notice}</Notice>}

        <h2 className={styles.sectionTitle}>How to earn</h2>
        <div className={styles.earn}>
          <div><CalendarCheck size={16} /><span>Daily check-in</span><b>+5 to +25</b></div>
          <div><Award size={16} /><span>Earn a badge</span><b>+20</b></div>
        </div>
        <p className={styles.hint}>Check-in points rise each day of your streak and peak on day 7.</p>

        <h2 className={styles.sectionTitle}>Rewards</h2>
        <div className={styles.items}>
          {items.map((item) => {
            const Icon = item.kind === "freeze" ? Snowflake : (item.badge_id && badgeIcons[item.badge_id]) || Award;
            const state = itemState(item);
            return (
              <article className={styles.item} key={item.id}>
                <span className={`${styles.itemIcon} ${item.kind === "freeze" ? styles.itemFreeze : ""}`}><Icon size={18} /></span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                  <em><Coins size={11} />{item.cost} pts</em>
                </div>
                <button type="button" onClick={() => { setNotice(""); setRedeeming(item); }} disabled={state.disabled}>{state.label}</button>
              </article>
            );
          })}
        </div>

        <h2 className={styles.sectionTitle}>History</h2>
        {ledger.length ? (
          <div className={styles.history}>
            {history.visible.map((entry, index) => (
              <div key={`${entry.created_at}-${index}`}>
                <span>{entry.reason}<small>{formatDate(entry.created_at)}</small></span>
                <b className={entry.amount < 0 ? styles.spent : styles.earned}>{entry.amount > 0 ? "+" : ""}{entry.amount}</b>
              </div>
            ))}
            <ShowMoreButton remaining={history.remaining} canCollapse={history.canCollapse} onShowMore={history.showMore} onShowLess={history.showLess} />
          </div>
        ) : <p className={styles.hint}>No points yet. Your first check-in is on the dashboard.</p>}
      </div>
      <ConfirmationModal
        open={Boolean(redeeming)}
        title={`Redeem ${redeeming?.name || ""}?`}
        description={`This uses ${redeeming?.cost || 0} of your ${balance} points.`}
        confirmLabel="Redeem"
        onCancel={() => setRedeeming(null)}
        onConfirm={redeem}
      />
    </MobileLayout>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
