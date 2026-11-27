import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  FileText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type {
  ReadinessData,
  ReadinessSkill,
} from "../readiness/readinessApi";
import type { ResumeSummary } from "../resume/types";
import { Badge, Button, Card, SectionCard } from "../../components/ui/Primitives";

export interface DashboardSkillGapItem {
  skill: string;
  count: number;
  isWeak: boolean;
  sampleJobId?: string;
}

export interface DashboardSkillProfileBuckets {
  verifiedStrengths: ReadinessSkill[];
  interviewWeaknesses: ReadinessSkill[];
  resumeOnlyClaims: string[];
}

export interface DashboardSkillProfileHubProps {
  readiness?: ReadinessData;
  latestResume?: ResumeSummary;
  readinessScore: number;
  skillProfileBuckets: DashboardSkillProfileBuckets;
  prioritySkillGaps: DashboardSkillGapItem[];
}

export const DashboardSkillProfileHub: React.FC<
  DashboardSkillProfileHubProps
> = ({
  readiness,
  latestResume,
  readinessScore,
  skillProfileBuckets,
  prioritySkillGaps,
}) => {
  const navigate = useNavigate();

  return (
    <SectionCard
      eyebrow="Closed-Loop Verification Engine"
      title="Verified Skill Profile & Match Improvement Potential"
      description="TrueHire updates your profile after every interview so your next job match reflects verified capability rather than unvalidated keywords."
      action={
        <div className="flex flex-wrap items-center gap-2">
          {readiness?.matchImprovement &&
            readiness.matchImprovement.trackedJobsCount > 0 && (
              <Badge tone="success" size="sm">
                Match potential:{" "}
                {readiness.matchImprovement.currentAvgMatchPct}% →{" "}
                {readiness.matchImprovement.projectedAvgMatchPct}% (+
                {readiness.matchImprovement.potentialGainPct}%)
              </Badge>
            )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/readiness")}
          >
            Inspect interview history per skill
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Closed-Loop Stepper */}
        <div className="grid gap-2.5 sm:grid-cols-5">
          {[
            {
              step: "1. Resume Claims",
              value: `${latestResume?.skills.length ?? 0} listed`,
              note: latestResume
                ? latestResume.fileName || latestResume.title
                : "Upload resume",
              tone: "neutral" as const,
            },
            {
              step: "2. Interviews",
              value: `${(readiness?.skills ?? []).length} tested`,
              note: "Rubric-scored Q&A",
              tone: "primary" as const,
            },
            {
              step: "3. Evidence",
              value: `${skillProfileBuckets.verifiedStrengths.length} strong`,
              note: `${skillProfileBuckets.interviewWeaknesses.length} weak exposed`,
              tone: "success" as const,
            },
            {
              step: "4. Updated Profile",
              value: `${readinessScore}% ready`,
              note: "Weak claims withheld",
              tone: "primary" as const,
            },
            {
              step: "5. Better Next Match",
              value:
                readiness?.matchImprovement &&
                readiness.matchImprovement.potentialGainPct > 0
                  ? `+${readiness.matchImprovement.potentialGainPct}% gain`
                  : "Live sync",
              note: readiness?.matchImprovement?.topUnlockSkill
                ? `Top target: ${readiness.matchImprovement.topUnlockSkill}`
                : "Explore roles",
              tone: "success" as const,
            },
          ].map((stage) => (
            <Card key={stage.step} muted padding="sm" className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-content-secondary">
                  {stage.step}
                </span>
                <Badge tone={stage.tone} size="sm">
                  {stage.value}
                </Badge>
              </div>
              <p className="truncate text-xs font-medium text-content-heading">
                {stage.note}
              </p>
            </Card>
          ))}
        </div>

        {/* 4 Quadrants: Verified Strengths | Interview Weaknesses | Resume-Only Claims | Critical Missing Skills */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Quadrant 1: Verified Strengths */}
          <Card padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-success">
                <ShieldCheck className="h-4 w-4" />
                Verified Strengths (
                {skillProfileBuckets.verifiedStrengths.length})
              </span>
              <span className="text-[11px] text-content-secondary">
                Interview-proven
              </span>
            </div>
            {skillProfileBuckets.verifiedStrengths.length === 0 ? (
              <p className="text-xs text-content-secondary">
                No interview-verified strengths yet. Complete a targeted
                interview to prove your top resume skills.
              </p>
            ) : (
              <ul className="space-y-2">
                {skillProfileBuckets.verifiedStrengths
                  .slice(0, 4)
                  .map((s) => (
                    <li
                      key={s.skill}
                      className="rounded-input border border-border bg-muted/40 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="font-semibold text-content-heading">
                          {s.skill}
                        </strong>
                        <span className="text-[11px] text-content-secondary tabular-nums">
                          {new Date(s.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-content-secondary">
                        {s.evidence}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          {/* Quadrant 2: Interview-Identified Weaknesses */}
          <Card padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-warning">
                <AlertTriangle className="h-4 w-4" />
                Interview-Identified Weaknesses (
                {skillProfileBuckets.interviewWeaknesses.length})
              </span>
              <span className="text-[11px] text-content-secondary">
                Credit withheld
              </span>
            </div>
            {skillProfileBuckets.interviewWeaknesses.length === 0 ? (
              <p className="text-xs text-content-secondary">
                Zero skills currently flagged weak in mock interviews.
              </p>
            ) : (
              <ul className="space-y-2">
                {skillProfileBuckets.interviewWeaknesses
                  .slice(0, 4)
                  .map((s) => (
                    <li
                      key={s.skill}
                      className="flex items-center justify-between gap-2 rounded-input border border-border bg-muted/40 p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <strong className="font-semibold text-content-heading">
                          {s.skill}
                        </strong>
                        <p className="truncate text-content-secondary">
                          {s.evidence} ·{" "}
                          {new Date(s.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/jobs")}
                      >
                        Re-verify
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          {/* Quadrant 3: Resume-Only Claims */}
          <Card padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <FileText className="h-4 w-4" />
                Resume-Only Claims (
                {skillProfileBuckets.resumeOnlyClaims.length})
              </span>
              <span className="text-[11px] text-content-secondary">
                {latestResume
                  ? `Uploaded ${new Date(latestResume.createdAt).toLocaleDateString()}`
                  : "Unvalidated"}
              </span>
            </div>
            {skillProfileBuckets.resumeOnlyClaims.length === 0 ? (
              <p className="text-xs text-content-secondary">
                {latestResume
                  ? "All extracted resume skills have been evaluated!"
                  : "Upload a resume to extract your initial skill claims."}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {skillProfileBuckets.resumeOnlyClaims
                    .slice(0, 10)
                    .map((skill) => (
                      <Badge key={skill} tone="neutral" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  {skillProfileBuckets.resumeOnlyClaims.length > 10 && (
                    <Badge tone="neutral" size="sm">
                      +{skillProfileBuckets.resumeOnlyClaims.length - 10} more
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-content-secondary">
                  Listed on your resume but not yet verified in an interview.
                </p>
              </div>
            )}
          </Card>

          {/* Quadrant 4: Critical Missing Skills & Match Improvement Potential */}
          <Card padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-danger">
                <TrendingUp className="h-4 w-4" />
                Critical Missing Skills ({prioritySkillGaps.length})
              </span>
              <span className="text-[11px] text-content-secondary">
                Highest match upside
              </span>
            </div>
            {prioritySkillGaps.length === 0 ? (
              <p className="text-xs text-content-secondary">
                Match with a role to surface critical missing skills and
                projected score gains.
              </p>
            ) : (
              <ul className="space-y-2">
                {prioritySkillGaps.slice(0, 4).map((gap) => (
                  <li
                    key={gap.skill}
                    className="flex items-center justify-between gap-2 rounded-input border border-border bg-muted/40 p-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <strong className="font-semibold text-content-heading">
                        {gap.skill}
                      </strong>
                      <p className="truncate text-content-secondary">
                        Required in {gap.count}{" "}
                        {gap.count === 1 ? "role" : "roles"} · +8–15% match
                        potential
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          gap.sampleJobId
                            ? `/skill-gaps/${gap.sampleJobId}?focusSkill=${encodeURIComponent(gap.skill)}`
                            : "/jobs",
                        )
                      }
                    >
                      Close gap
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </SectionCard>
  );
};

export default DashboardSkillProfileHub;
