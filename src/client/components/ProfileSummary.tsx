import { BadgeCheck, BriefcaseBusiness, GraduationCap } from "lucide-react";
import { formatContact, formatEducation } from "../lib/profile";
import type { StaticProfile } from "../lib/types";

export function ProfileSummary({ profile }: { profile: StaticProfile }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <BadgeCheck size={16} />
        Static Profile
      </div>
      <h2 className="compact-heading">{profile.name}</h2>
      <p className="muted">{formatContact(profile)}</p>
      <div className="mini-list">
        <div>
          <GraduationCap size={14} />
          <span>{profile.education[0] ? formatEducation(profile.education[0]) : "Education not configured"}</span>
        </div>
        <div>
          <BriefcaseBusiness size={14} />
          <span>{profile.employers.map((job) => job.employer).join(", ")}</span>
        </div>
      </div>
    </section>
  );
}
