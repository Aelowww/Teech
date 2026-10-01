"use client";

import { CheckCircle2 } from "lucide-react";
import { ConfirmationModal } from "./confirmation-modal";

export function SuccessModal({ open, title, description, onDone }: { open: boolean; title: string; description: string; onDone: () => void }) {
  return <ConfirmationModal open={open} title={title} description={description} confirmLabel="Done" tone="success" icon={CheckCircle2} hideCancel onCancel={onDone} onConfirm={onDone} />;
}
