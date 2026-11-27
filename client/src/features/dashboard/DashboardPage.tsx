import React, { Suspense, lazy, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Target,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useReadiness } from "../readiness/useReadiness";
import type { ReadinessSkill } from "../readiness/readinessApi";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import type { Application } from "../tracker/types";
import { fetchJobs } from "../jobs/jobsApi";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Button,
  Card,
  ErrorState,
  Skeleton,
} from "../../components/ui/Primitives";

const ReadinessPanel = lazy(() =>
  import("../readiness/ReadinessPanel").then((m) => ({
    default: m.ReadinessPanel,
  })),
);
const DashboardSkillProfileHub = lazy(() =>
  import("./DashboardSkillProfileHub").then((m) => ({
    default: m.DashboardSkillProfileHub,
  })),
);
const DashboardAnalyticsCharts = lazy(() =>
  import("./DashboardAnalyticsCharts").then((m) => ({
    default: m.DashboardAnalyticsCharts,
  })),
);
const DashboardActivitySection = lazy(() =>
  import("./DashboardActivitySection").then((m) => ({
    default: m.DashboardActivitySection,
  })),
);

interface JobSummary {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  source?: string | null;
  skills?: string[];
  externalUrl?: string | null;
}

const ReadinessPanelFallback: React.FC = () => (
  <Card padding="md" className="space-y-4" aria-busy="true">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-6 w-28" />
    </div>
    <Skeleton className="h-20 w-full" />
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </Card>
);

const SkillProfileHubFallback: React.FC = () => (
  <Card padding="md" className="space-y-5" aria-busy="true">
    <div className="space-y-2">
      <Skeleton className="h-3.5 w-44" />
      <Skeleton className="h-6 w-72" />
    </div>
    <div className="grid gap-2.5 sm:grid-cols-5">
      {Array.from({ length: 5 }).map((_, idx) => (
        <Skeleton key={idx} className="h-16 w-full" />
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Skeleton key={idx} className="h-36 w-full" />
      ))}
    </div>
  </Card>
);

const AnalyticsChartsFallback: React.FC = () => (
  <div className="grid gap-6 lg:grid-cols-12" aria-busy="true">
    <Card padding="md" className="space-y-4 lg:col-span-6">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-48 w-full" />
    </Card>
    <Card padding="md" className="space-y-4 lg:col-span-6">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-48 w-full" />
    </Card>
  </div>
);

const ActivitySectionFallback: React.FC = () => (
  <div className="space-y-6" aria-busy="true">
    <div className="grid gap-6 lg:grid-cols-12">
      <Card padding="md" className="space-y-3 lg:col-span-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
      <Card padding="md" className="space-y-3 lg:col-span-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
    </div>
    <div className="grid gap-6 lg:grid-cols-12">
      <Card padding="md" className="space-y-3 lg:col-span-8">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-32 w-full" />
      </Card>
      <Card padding="md" className="space-y-3 lg:col-span-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full" />
      </Card>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    data: resumes,
    isLoading: resumesLoading,
    isError: resumesError,
    refetch: refetchResumes,
  } = useResumes();
  const {
    data: applications,
    isLoading: appsLoading,
    isError: appsError,
    refetch: refetchApps,
  } = useApplications();
  const { data: readiness, isLoading: readinessLoading } = useReadiness();

  // Fetch verified jobs so Recommended Jobs always has real roles even before tracking
  const { data: publicJobs } = useQuery<JobSummary[]>({
    queryKey: ["dashboard-recommended-jobs"],
    queryFn: async () => {
      const list = await fetchJobs();
      return list.slice(0, 4);
    },
    staleTime: 60_000,
  });

  const latestResume = resumes?.[0];
  const firstName = user?.name?.split(" ")[0];

  // Calculate metrics with concrete values and explanations
  const metrics = useMemo(() => {
    const verified =
      readiness?.skills.filter((s: ReadinessSkill) => s.status === "STRONG")
        .length ?? 0;
    const needsPractice =
      readiness?.skills.filter((s: ReadinessSkill) => s.status === "WEAK")
        .length ?? 0;
    const activePipeline = (applications ?? []).filter(
      (a: Application) => a.status !== "REJECTED",
    ).length;
    const extractedSkills = latestResume?.skills.length ?? 0;

    const totalSkills = verified + needsPractice + extractedSkills;
    const readinessScore =
      readiness?.defenseSummary?.defensibilityPct ??
      (totalSkills > 0
        ? Math.round(
            ((verified * 1.0 + extractedSkills * 0.5) / totalSkills) * 100,
          )
        : 0);

    return {
      readinessScore,
      verified,
      needsPractice,
      activePipeline,
      extractedSkills,
    };
  }, [readiness, applications, latestResume]);

  const skillProfileBuckets = useMemo(() => {
    const verifiedStrengths = (readiness?.skills ?? []).filter(
      (s: ReadinessSkill) => s.status === "STRONG",
    );
    const interviewWeaknesses = (readiness?.skills ?? []).filter(
      (s: ReadinessSkill) => s.status === "WEAK",
    );
    const evaluatedSet = new Set(
      (readiness?.skills ?? []).map((s: ReadinessSkill) =>
        s.skill.toLowerCase().trim(),
      ),
    );
    const resumeOnlyClaims = (latestResume?.skills ?? []).filter(
      (sk: string) => !evaluatedSet.has(sk.toLowerCase().trim()),
    );
    return {
      verifiedStrengths,
      interviewWeaknesses,
      resumeOnlyClaims,
    };
  }, [readiness, latestResume]);

  // Top 3–5 Priority Skill Gaps with related job counts
  const prioritySkillGaps = useMemo(() => {
    const counts = new Map<
      string,
      { skill: string; count: number; isWeak: boolean; sampleJobId?: string }
    >();

    for (const s of readiness?.skills ?? []) {
      if (s.status === "WEAK") {
        const key = s.skill.toLowerCase().trim();
        counts.set(key, {
          skill: s.skill,
          count: 1,
          isWeak: true,
        });
      }
    }

    for (const app of applications ?? []) {
      for (const gap of app.skillGaps ?? []) {
        const key = gap.toLowerCase().trim();
        if (!key) continue;
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
          existing.sampleJobId = existing.sampleJobId || app.jobId;
        } else {
          counts.set(key, {
            skill: gap,
            count: 1,
            isWeak: false,
            sampleJobId: app.jobId,
          });
        }
      }
    }

    return [...counts.values()]
      .sort((a, b) => Number(b.isWeak) - Number(a.isWeak) || b.count - a.count)
      .slice(0, 5);
  }, [readiness, applications]);

  // Recommended Jobs: combine tracked roles with match data + verified catalog roles
  const recommendedJobs = useMemo(() => {
    const resumeSkillSet = new Set(
      (latestResume?.skills ?? []).map((s: string) => s.toLowerCase().trim()),
    );

    if (applications && applications.length > 0) {
      return applications.slice(0, 4).map((app: Application) => ({
        id: app.jobId,
        title: app.job.title,
        company: app.job.company,
        location: app.job.location ?? "Remote / Hybrid",
        source: "Greenhouse",
        matchScore: app.matchScore != null ? Math.round(app.matchScore) : null,
        missingSkills: app.skillGaps ?? [],
        status: app.status,
      }));
    }

    return (publicJobs ?? []).slice(0, 4).map((job) => {
      const jobSkills = job.skills ?? [];
      const missing = jobSkills.filter(
        (s) => !resumeSkillSet.has(s.toLowerCase().trim()),
      );
      const matchedCount = jobSkills.length - missing.length;
      const computedScore =
        jobSkills.length > 0 && latestResume
          ? Math.round((matchedCount / jobSkills.length) * 100)
          : null;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location ?? "Verified Listing",
        source: job.source ?? "Greenhouse",
        matchScore: computedScore,
        missingSkills: missing,
        status: null,
      };
    });
  }, [applications, publicJobs, latestResume]);

  // Recent Activity Feed
  const recentActivity = useMemo(() => {
    const items: {
      id: string;
      typeLabel: string;
      title: string;
      detail: string;
      date: string;
      actionLabel: string;
      to: string;
      tone: "primary" | "success" | "warning" | "neutral";
    }[] = [];

    if (latestResume) {
      items.push({
        id: `resume-${latestResume.id}`,
        typeLabel: "Resume uploaded",
        title: latestResume.fileName ?? latestResume.title,
        detail: `${latestResume.skills.length} technical skills extracted for matching`,
        date: latestResume.createdAt,
        actionLabel: "Review skills",
        to: "/resume",
        tone: "primary",
      });
    }

    for (const s of (readiness?.skills ?? []).slice(0, 3)) {
      items.push({
        id: `skill-${s.skill}-${s.updatedAt}`,
        typeLabel:
          s.status === "STRONG" ? "Skill verified" : "Interview feedback",
        title: `${s.skill} marked ${s.status === "STRONG" ? "Verified" : "Needs practice"}`,
        detail: s.evidence || "Updated from mock interview rubric evaluation",
        date: s.updatedAt,
        actionLabel: "View evidence",
        to: "/readiness",
        tone: s.status === "STRONG" ? "success" : "warning",
      });
    }

    for (const app of (applications ?? []).slice(0, 3)) {
      items.push({
        id: `app-${app.id}`,
        typeLabel: `Application · ${app.status}`,
        title: `${app.job.title} at ${app.job.company}`,
        detail:
          app.matchScore != null
            ? `${Math.round(app.matchScore)}% requirement coverage · ${
                app.skillGaps?.length ?? 0
              } gaps`
            : "Added to application tracker",
        date: app.updatedAt,
        actionLabel: "View match",
        to: `/matches/${app.jobId}${latestResume ? `?resumeId=${latestResume.id}` : ""}`,
        tone: "neutral",
      });
    }

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [latestResume, readiness, applications]);

  const metricsLoading = resumesLoading || appsLoading || readinessLoading;

  const pipelineFunnelData = useMemo(() => {
    const counts = {
      SAVED: 0,
      APPLIED: 0,
      INTERVIEWING: 0,
      OFFER: 0,
    };
    for (const app of applications ?? []) {
      if (app.status in counts) {
        counts[app.status as keyof typeof counts] += 1;
      }
    }
    return [
      { label: "Saved", value: counts.SAVED, tone: "neutral" as const },
      { label: "Applied", value: counts.APPLIED, tone: "primary" as const },
      {
        label: "Interviewing",
        value: counts.INTERVIEWING,
        tone: "warning" as const,
      },
      { label: "Offer", value: counts.OFFER, tone: "success" as const },
    ];
  }, [applications]);

  const skillEvidenceDonut = useMemo(
    () => [
      {
        label: "Verified strengths",
        value: skillProfileBuckets.verifiedStrengths.length,
        tone: "success" as const,
      },
      {
        label: "Resume-only claims",
        value: skillProfileBuckets.resumeOnlyClaims.length,
        tone: "primary" as const,
      },
      {
        label: "Needs practice",
        value: skillProfileBuckets.interviewWeaknesses.length,
        tone: "warning" as const,
      },
      {
        label: "Target role gaps",
        value: prioritySkillGaps.length,
        tone: "danger" as const,
      },
    ],
    [skillProfileBuckets, prioritySkillGaps.length],
  );

  const metricCards = [
    {
      label: "Overall Readiness Score",
      value: `${metrics.readinessScore}%`,
      explanation:
        metrics.verified > 0
          ? `Weighted across ${metrics.verified} interview-verified and ${metrics.extractedSkills} resume skills.`
          : metrics.extractedSkills > 0
            ? `Based on ${metrics.extractedSkills} extracted resume skills awaiting interview verification.`
            : "Upload a resume and complete a mock interview to calculate readiness.",
      actionLabel: "View readiness report",
      to: "/readiness",
      toneClass: "text-primary",
      icon: <Award className="h-4 w-4 text-primary" />,
    },
    {
      label: "Skills Verified",
      value: `${metrics.verified}`,
      explanation:
        metrics.verified > 0
          ? "Skills proven with strong scores in targeted mock interviews."
          : "No skills verified in interviews yet — start a mock session.",
      actionLabel:
        metrics.verified > 0 ? "Inspect verified skills" : "Start an interview",
      to: metrics.verified > 0 ? "/readiness" : "/interviews",
      toneClass: "text-status-success",
      icon: <CheckCircle2 className="h-4 w-4 text-status-success" />,
    },
    {
      label: "Priority Skill Gaps",
      value: `${prioritySkillGaps.length}`,
      explanation:
        prioritySkillGaps.length > 0
          ? `${metrics.needsPractice} flagged in interviews and ${Math.max(
              0,
              prioritySkillGaps.length - metrics.needsPractice,
            )} missing across target roles.`
          : "Compare your resume with jobs to surface missing requirements.",
      actionLabel: "Practice top gaps",
      to: "/skills",
      toneClass: "text-status-warning",
      icon: <Target className="h-4 w-4 text-status-warning" />,
    },
    {
      label: "Active Applications",
      value: `${metrics.activePipeline}`,
      explanation:
        metrics.activePipeline > 0
          ? "Roles currently tracked across Saved, Applied, and Interviewing."
          : "Save and match engineering roles to track your pipeline.",
      actionLabel:
        metrics.activePipeline > 0 ? "Open pipeline tracker" : "Explore jobs",
      to: metrics.activePipeline > 0 ? "/applications" : "/jobs",
      toneClass: "text-content-heading",
      icon: <Briefcase className="h-4 w-4 text-content-secondary" />,
    },
  ];

  return (
    <ContentContainer size="xl" className="space-y-6">
      {/* 1. Welcome Header */}
      <PageHeader
        eyebrow="Verified Skill Profile · Home"
        title={
          firstName
            ? `${firstName}'s Verified Skill Profile`
            : "Verified Skill Profile"
        }
        description="Resume claim → interview → evidence → updated profile → better next match. Every skill is separated into proven strengths, unverified resume claims, interview weaknesses, and critical gaps."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => navigate("/readiness")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Open full skill ledger
          </Button>
        }
        secondaryActions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/radar")}>
              Role-Fit Radar
            </Button>
            <Button variant="outline" onClick={() => navigate("/jobs")}>
              Match against jobs
            </Button>
          </div>
        }
      />

      {(resumesError || appsError) && (
        <ErrorState
          title="Some workspace data could not be loaded"
          message="Please retry to refresh your latest resumes and tracked applications."
          onRetry={() => {
            void refetchResumes();
            void refetchApps();
          }}
        />
      )}

      {/* 2. Lead With Next Best Action (Lazy-loaded) */}
      <Suspense fallback={<ReadinessPanelFallback />}>
        <ReadinessPanel />
      </Suspense>

      {/* 2B. Closed-Loop Verified Skill Profile Hub (Lazy-loaded) */}
      <Suspense fallback={<SkillProfileHubFallback />}>
        <DashboardSkillProfileHub
          readiness={readiness}
          latestResume={latestResume}
          readinessScore={metrics.readinessScore}
          skillProfileBuckets={skillProfileBuckets}
          prioritySkillGaps={prioritySkillGaps}
        />
      </Suspense>

      {/* 3. Actionable Readiness Metrics (Immediate lightweight KPI row) */}
      <section
        aria-label="Readiness overview metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metricCards.map((item) => (
          <Card
            key={item.label}
            padding="sm"
            className="flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-content-secondary">
                  {item.label}
                </span>
                {item.icon}
              </div>

              {metricsLoading ? (
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ) : (
                <>
                  <p
                    className={`text-2xl font-semibold tracking-tight tabular-nums ${item.toneClass}`}
                  >
                    {item.value}
                  </p>
                  <p className="text-xs leading-relaxed text-content-secondary">
                    {item.explanation}
                  </p>
                </>
              )}
            </div>

            <div className="border-t border-border pt-2.5">
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </section>

      {/* 3B. Visual Readiness Distribution & Pipeline Funnel Charts (Lazy-loaded) */}
      <Suspense fallback={<AnalyticsChartsFallback />}>
        <DashboardAnalyticsCharts
          skillEvidenceDonut={skillEvidenceDonut}
          pipelineFunnelData={pipelineFunnelData}
          readinessScore={metrics.readinessScore}
          metricsLoading={metricsLoading}
          appsLoading={appsLoading}
        />
      </Suspense>

      {/* 4 & 5. Priority Skill Gaps, Recommended Jobs, Recent Activity & Active Resume (Lazy-loaded) */}
      <Suspense fallback={<ActivitySectionFallback />}>
        <DashboardActivitySection
          prioritySkillGaps={prioritySkillGaps}
          recommendedJobs={recommendedJobs}
          recentActivity={recentActivity}
          latestResume={latestResume}
          metricsLoading={metricsLoading}
          appsLoading={appsLoading}
          resumesLoading={resumesLoading}
        />
      </Suspense>
    </ContentContainer>
  );
};

export default DashboardPage;
