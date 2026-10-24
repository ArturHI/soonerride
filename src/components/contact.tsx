"use client";

import { MessageCircle, Phone } from "lucide-react";
import { firstName } from "@/lib/format";
import type { User } from "@/lib/types";
import { cx } from "./ui";

export function phoneLabel(digits: string) {
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Text / Call buttons for someone you have a confirmed ride with. */
export function ContactButtons({ user, compact }: { user: User; compact?: boolean }) {
  if (!user.phone) {
    return compact ? null : <p className="text-[13px] text-ink-3">{firstName(user.name)} hasn't added a phone number.</p>;
  }
  const btn = cx(
    "flex items-center justify-center gap-1.5 rounded-full bg-surface font-semibold text-ink ring-1 ring-line active:bg-fill",
    compact ? "h-9 w-9" : "h-11 flex-1 text-[15px]",
  );
  return (
    <div className={cx("flex gap-2", !compact && "w-full")}>
      <a href={`sms:+1${user.phone}`} className={btn} aria-label={`Text ${firstName(user.name)}`}>
        <MessageCircle size={compact ? 16 : 18} />
        {!compact && "Text"}
      </a>
      <a href={`tel:+1${user.phone}`} className={btn} aria-label={`Call ${firstName(user.name)}`}>
        <Phone size={compact ? 16 : 18} />
        {!compact && "Call"}
      </a>
    </div>
  );
}
