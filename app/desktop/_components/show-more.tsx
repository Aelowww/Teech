"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import styles from "./show-more.module.css";

export const defaultPageSize = 5;

export function useShowMore<T>(items: T[], pageSize = defaultPageSize) {
  const [limit, setLimit] = useState(pageSize);
  return {
    visible: items.slice(0, limit),
    remaining: Math.max(items.length - limit, 0),
    canCollapse: limit > pageSize && items.length > pageSize,
    showMore: () => setLimit((current) => current + pageSize),
    showLess: () => setLimit(pageSize),
    pageSize,
  };
}

export function ShowMoreButton({
  remaining,
  canCollapse,
  onShowMore,
  onShowLess,
}: {
  remaining: number;
  canCollapse: boolean;
  onShowMore: () => void;
  onShowLess: () => void;
}) {
  if (remaining > 0) {
    return (
      <button className={`${buttonStyles.button} ${buttonStyles.secondary} ${buttonStyles.block} ${styles.button}`} type="button" onClick={onShowMore}>
        Show more
        <ChevronDown size={15} />
      </button>
    );
  }
  if (canCollapse) {
    return (
      <button className={`${buttonStyles.button} ${buttonStyles.secondary} ${buttonStyles.block} ${styles.button}`} type="button" onClick={onShowLess}>
        Show less
        <ChevronUp size={15} />
      </button>
    );
  }
  return null;
}
