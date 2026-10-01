"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, CalendarCheck, Check, Coins, Snowflake } from "lucide-react";
<<<<<<< HEAD
import { DesktopLayout, Notice, PageHeading } from "@/app/desktop/_components/ui";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { ShowMoreButton, useShowMore } from "@/app/desktop/_components/show-more";
import { badgeIcons } from "@/app/desktop/_components/badge-icons";
=======
import { DesktopLayout, EmptyState, Notice, PageHeading } from "@/app/desktop/_components/ui";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { SuccessModal } from "@/app/desktop/_components/success-modal";
import { ShowMoreButton, useShowMore } from "@/app/desktop/_components/show-more";
import { badgeIcons, badgeRarity } from "@/app/desktop/_components/badge-icons";
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "./button.module.css";
import styles from "./points-shop.module.css";

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
<<<<<<< HEAD
    setNotice(`${redeeming.name} redeemed!`);
=======
    setNotice(redeeming.name);
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    await load();
  }

  function itemState(item: ShopItem) {
    if (item.kind === "badge" && item.badge_id && ownedBadges.includes(item.badge_id)) return { label: "Owned", disabled: true };
    if (item.kind === "freeze" && freezes >= item.max_owned) return { label: `Max ${item.max_owned}`, disabled: true };
    if (balance < item.cost) return { label: `${item.cost - balance} more`, disabled: true };
    return { label: "Redeem", disabled: false };
  }

  const nextReward = items
    .filter((item) => item.cost > balance && !itemState(item).label.startsWith("Owned") && !itemState(item).label.startsWith("Max"))
    .sort((first, second) => first.cost - second.cost)[0];

  return (
    <DesktopLayout className={styles.screen} role={role} activeNav="points">
      <PageHeading title="Points & Rewards" subtitle="Earn points by showing up. Spend them on rewards." />
      <div className={styles.page}>
        <div className={styles.mainColumn}>
          <section className={styles.summary}>
            <div className={styles.balance}>
              <span className={styles.balanceIcon}><Coins size={22} /></span>
              <div>
                <small>Your balance</small>
                <strong>{balance}<em>pts</em></strong>
              </div>
              {freezes > 0 && <p className={styles.freezes}><Snowflake size={12} />{freezes} {freezes === 1 ? "freeze" : "freezes"} ready</p>}
            </div>

            <div className={styles.next}>
              {nextReward ? (
                <>
                  <p><span>Next reward</span><strong>{nextReward.name}</strong></p>
                  <div className={styles.track} role="progressbar" aria-valuemin={0} aria-valuemax={nextReward.cost} aria-valuenow={balance} aria-label={`Progress to ${nextReward.name}`}>
                    <i style={{ width: `${Math.min(100, (balance / nextReward.cost) * 100)}%` }} />
                  </div>
                  <small>{nextReward.cost - balance} pts to go</small>
                </>
              ) : (
                <p><span>Next reward</span><strong>{items.length ? "You can redeem everything available" : "Rewards are coming soon"}</strong></p>
              )}
            </div>

            <div className={styles.earn} aria-label="How to earn">
              <span><CalendarCheck size={15} />Daily check-in <b>+5 to +25</b></span>
              <span><Award size={15} />Earn a badge <b>+20</b></span>
            </div>
          </section>

          {error && <Notice error>{error}</Notice>}
<<<<<<< HEAD
          {notice && <Notice>{notice}</Notice>}
=======
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4

          <section className={styles.rewards}>
            <h2 className={styles.sectionTitle}>Rewards</h2>
            <div className={styles.items}>
              {items.map((item) => {
                const Icon = item.kind === "freeze" ? Snowflake : (item.badge_id && badgeIcons[item.badge_id]) || Award;
                const state = itemState(item);
                const owned = state.label === "Owned" || state.label.startsWith("Max");
<<<<<<< HEAD
                const affordable = !state.disabled;
                return (
                  <article className={`${styles.item} ${owned ? styles.itemOwned : ""}`} key={item.id}>
                    <span className={`${styles.itemIcon} ${item.kind === "freeze" ? styles.itemFreeze : ""}`}><Icon size={20} /></span>
                    <div className={styles.itemText}>
                      <strong>{item.name}</strong>
=======
                const rarity = item.badge_id ? badgeRarity[item.badge_id] : undefined;
                const affordable = !state.disabled;
                return (
                  <article className={`${styles.item} ${rarity ? styles[rarity] : ""} ${owned ? styles.itemOwned : ""}`} key={item.id}>
                    <span className={`${styles.itemIcon} ${item.kind === "freeze" ? styles.itemFreeze : ""}`}><Icon size={20} /></span>
                    <div className={styles.itemText}>
                      <strong>{item.name}{rarity && <span className={styles.rarity}>{rarity}</span>}</strong>
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
                      <small>{item.description}</small>
                    </div>
                    <div className={styles.itemAction}>
                      <em><Coins size={13} />{item.cost} pts</em>
                      {affordable ? (
                        <button className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.redeem}`} type="button" onClick={() => { setNotice(""); setRedeeming(item); }}>Redeem</button>
                      ) : owned ? (
                        <span className={styles.ownedTag}><Check size={13} strokeWidth={2.75} />{state.label}</span>
                      ) : (
                        <span className={styles.needMore}>
                          <span className={styles.miniTrack}><i style={{ width: `${Math.min(100, (balance / item.cost) * 100)}%` }} /></span>
                          {state.label}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className={styles.hint}>Check-in points rise each day of your streak and peak on day 7.</p>
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.panel}>
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
<<<<<<< HEAD
            ) : <p className={styles.hint}>No points yet. Your first check-in is on the dashboard.</p>}
=======
            ) : <EmptyState compact scene="bell" title="No points yet. Your first check-in is on the dashboard." action={{ label: "Go to dashboard", href: `/${role}/home` }} />}
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
          </section>
        </aside>
      </div>
      <ConfirmationModal
        open={Boolean(redeeming)}
        title={`Redeem ${redeeming?.name || ""}?`}
        description={`This uses ${redeeming?.cost || 0} of your ${balance} points.`}
        confirmLabel="Redeem"
        onCancel={() => setRedeeming(null)}
        onConfirm={redeem}
      />
<<<<<<< HEAD
=======
      <SuccessModal open={Boolean(notice)} title={`${notice} redeemed`} description="Your points balance has been updated." onDone={() => setNotice("")} />
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    </DesktopLayout>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
