import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, FileText } from "lucide-react";
import type { ResumeSummary } from "../resume/types";
import type { DashboardSkillGapItem } from "./DashboardSkillProfileHub";
import {
  Badge,
  Button,
  Card,
  JobCard,
  RequirementRow,
  SectionCard,
} from "../../components/ui/Primitives";

export interface DashboardRecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  matchScore: number | null;
  missingSkills: string[];
  status: string | null;
}

export interface DashboardActivityItem {
  id: string;
  typeLabel: string;
  title: string;
  detail: string;
  date: string;
  actionLabel: string;
  to: string;
  tone: "primary" | "success" | "warning" | "neutral";
}

export interface DashboardActivitySectionProps {
  prioritySkillGaps: DashboardSkillGapItem[];
  recommendedJobs: DashboardRecommendedJob[];
  recentActivity: DashboardActivityItem[];
  latestResume?: ResumeSummary;
  metricsLoading: boolean;
  appsLoading: boolean;
  resumesLoading: boolean;
}

export const DashboardActivitySection: React.FC<
  DashboardActivitySectionProps
> = ({
  prioritySkillGaps,
  recommendedJobs,
  recentActivity,
  latestResume,
  metricsLoading,
  appsLoading,
  resumesLoading,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* 4. Priority Skill Gaps & Recommended Jobs */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 6 cols: Priority Skill Gaps */}
        <div className="lg:col-span-6">
          <SectionCard
            eyebrow="Gap Prioritization"
            title="Priority Skill Gaps"
            description="Skills flagged in mock interviews or missing across your tracked roles."
            loading={metricsLoading}
            empty={prioritySkillGaps.length === 0}
            emptyTitle="No skill gaps identified yet"
            emptyDescription="Compare your resume with a verified job posting to rank missing skills by role frequency."
            emptyAction={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/jobs")}
              >
                Compare with a job
              </Button>
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/skills")}
              >
                All skills
              </Button>
            }
          >
            <div className="space-y-2.5">
              {prioritySkillGaps.map((gap) => (
                <RequirementRow
                  key={gap.skill}
                  skill={gap.skill}
                  status={gap.isWeak ? "WEAK" : "MISSING"}
                  priority={gap.isWeak || gap.count >= 2 ? "high" : "medium"}
                  frequencyLabel={`Appears in ${gap.count} ${
                    gap.count === 1 ? "role" : "roles"
                  }`}
                  evidence={
                    gap.isWeak
                      ? "Flagged in mock interview — practice to convert to Verified"
                      : "Missing from your active resume profile"
                  }
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          gap.sampleJobId
                            ? `/skill-gaps/${gap.sampleJobId}${
                                latestResume
                                  ? `?resumeId=${latestResume.id}`
                                  : ""
                              }`
                            : "/jobs",
                        )
                      }
                    >
                      Practice this skill
                    </Button>
                  }
                />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right 6 cols: Recommended Jobs */}
        <div className="lg:col-span-6">
          <SectionCard
            eyebrow="Role Discovery"
            title="Recommended Jobs"
            description="Verified roles matched against your current skill profile."
            loading={appsLoading}
            empty={recommendedJobs.length === 0}
            emptyTitle="No recommended jobs yet"
            emptyDescription="Browse the verified job directory to inspect requirement coverage and missing skills."
            emptyAction={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/jobs")}
              >
                Explore verified jobs
              </Button>
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/jobs")}
              >
                Browse all
              </Button>
            }
          >
            <div className="space-y-3">
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  id={job.id}
                  title={job.title}
                  company={job.company}
                  location={job.location}
                  source={job.source}
                  matchScore={job.matchScore}
                  appliedStatus={job.status}
                  skills={
                    job.missingSkills.length > 0
                      ? job.missingSkills.map((s: string) => `Missing: ${s}`)
                      : ["All listed skills matched"]
                  }
                  onSelect={() =>
                    navigate(
                      `/matches/${job.id}${
                        latestResume ? `?resumeId=${latestResume.id}` : ""
                      }`,
                    )
                  }
                  actions={
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/matches/${job.id}${
                              latestResume ? `?resumeId=${latestResume.id}` : ""
                            }`,
                          )
                        }
                      >
                        View match
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/skill-gaps/${job.id}${
                              latestResume ? `?resumeId=${latestResume.id}` : ""
                            }`,
                          )
                        }
                      >
                        Skill gaps
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* 5. Recent Activity & Active Resume Status */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Activity (8 cols) */}
        <div className="lg:col-span-8">
          <SectionCard
            eyebrow="Closed-Loop Log"
            title="Recent Activity"
            description="Latest updates across your resumes, job matches, and interview evaluations."
            loading={metricsLoading}
            empty={recentActivity.length === 0}
            emptyTitle="No activity recorded yet"
            emptyDescription="Upload a resume or match with a role to start building your readiness history."
            emptyAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/resume")}
              >
                Upload resume
              </Button>
            }
          >
            <ul className="divide-y divide-border">
              {recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.tone} size="sm">
                        {item.typeLabel}
                      </Badge>
                      <span className="truncate text-sm font-semibold text-content-heading">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-content-secondary">
                      {item.detail}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs text-content-secondary tabular-nums">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(item.to)}
                    >
                      {item.actionLabel}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* Active Resume Baseline (4 cols) */}
        <div className="lg:col-span-4">
          <SectionCard
            eyebrow="Matching Source"
            title="Active Resume"
            description="Used to compute requirement coverage."
            loading={resumesLoading}
            empty={!latestResume}
            emptyTitle="No resume uploaded"
            emptyDescription="Upload a PDF or DOCX resume to extract your skills and run deterministic job matches."
            emptyAction={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/resume")}
              >
                Upload resume
              </Button>
            }
            action={
              latestResume ? (
                <Badge tone="success" size="sm">
                  Active
                </Badge>
              ) : undefined
            }
          >
            {latestResume && (
              <div className="space-y-4">
                <Card muted padding="sm" className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <p className="truncate text-sm font-semibold text-content-heading">
                      {latestResume.fileName ?? latestResume.title}
                    </p>
                  </div>
                  <p className="text-xs text-content-secondary tabular-nums">
                    Uploaded{" "}
                    {new Date(latestResume.createdAt).toLocaleDateString()} ·{" "}
                    {latestResume.skills.length} skills extracted
                  </p>
                </Card>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-content-secondary">
                    Extracted skills sample
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {latestResume.skills.slice(0, 8).map((skill: string) => (
                      <Badge key={skill} tone="neutral" size="sm">
                        {skill}
                      </Badge>
                    ))}
                    {latestResume.skills.length > 8 && (
                      <Badge tone="neutral" size="sm">
                        +{latestResume.skills.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => navigate("/resume")}
                >
                  Manage or replace resume
                </Button>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
};

export default DashboardActivitySection;
