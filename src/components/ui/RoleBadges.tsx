import { BadgeCheck, Shield } from "lucide-react";

type RoleBadgesProps = {
  role?: "user" | "analyst" | "admin";
  isVerifiedAnalyst?: boolean;
  className?: string;
};

export default function RoleBadges({ role = "user", isVerifiedAnalyst = false, className }: RoleBadgesProps) {
  const wrapperClass = className ?? "inline-flex items-center gap-1.5";

  return (
    <span className={wrapperClass}>
      {role === "admin" ? (
        <span className="inline-flex items-center gap-1 rounded border border-[#ff9d2d66] bg-[#ff9d2d1f] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#ffd28e]">
          <Shield size={10} />
          Admin
        </span>
      ) : null}

      {isVerifiedAnalyst ? (
        <span className="inline-flex items-center gap-1 rounded border border-[#5aa6ff66] bg-[#5aa6ff1f] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9fc7ff]">
          <BadgeCheck size={10} />
          Verified
        </span>
      ) : null}
    </span>
  );
}
