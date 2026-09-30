import { Check } from "lucide-react";
import styles from "./booking-steps.module.css";

const steps = ["Date", "Time", "Details", "Review"];

export function BookingSteps({ current }: { current: number }) {
  return (
    <ol className={styles.steps} aria-label="Booking progress">
      {steps.map((label, index) => {
        const number = index + 1;
        const state = number < current ? styles.done : number === current ? styles.current : "";
        return (
          <li key={label} className={state} aria-current={number === current ? "step" : undefined}>
            <span>{number < current ? <Check size={14} strokeWidth={3} /> : number}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
