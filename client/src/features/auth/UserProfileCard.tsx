import React, { Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Briefcase,
  Edit3,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { useAuth } from "./useAuth";
import { useResumes } from "../resume/useResumes";
import { useReadiness } from "../readiness/useReadiness";
import type { ReadinessSkill } from "../readiness/readinessApi";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionCard,
  Skeleton,
} from "../../components/ui/Primitives";

const ProfileSkillsEvidencePanel = lazy(() =>
  import("./ProfileSkillsEvidencePanel").then((m) => ({
    default: m.ProfileSkillsEvidencePanel,
  })),
);

const SkillsEvidenceFallback: React.FC = () => (
  <Card padding="md" className="space-y-4" aria-busy="true">
    <div className="space-y-2">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-3.5 w-64" />
    </div>
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Skeleton key={idx} className="h-6 w-20 rounded-full" />
      ))}
    </div>
    <Skeleton className="h-24 w-full" />
  </Card>
);

export interface UserProfileCardProps {
  onEdit?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ onEdit }) => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const { data: readiness, isLoading: readinessLoading } = useReadiness();

  const latestResume = resumes?.[0];
  const verifiedSkills =
    readiness?.skills.filter((s: ReadinessSkill) => s.status === "STRONG") ??
    [];
  const weakSkills =
    readiness?.skills.filter((s: ReadinessSkill) => s.status === "WEAK") ?? [];

  const handleEditProfile = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigate("/profile-setup");
    }
  };

  if (authLoading) {
    return (
      <ContentContainer size="lg" className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </ContentContainer>
    );
  }

  if (!user) {
    return (
      <ContentContainer size="md">
        <EmptyState
          title="Not signed in"
          description="Sign in to view and manage your candidate profile."
          action={
            <Button variant="primary" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          }
        />
      </ContentContainer>
    );
  }

  const profileMetrics = [
    {
      label: "Target Engineering Role",
      value: user.targetRole || "Not set",
      explanation: user.experienceLevel
        ? `Calibrated for ${user.experienceLevel} roles.`
        : "Set your target role and seniority to personalize job matching.",
      actionLabel: "Update target role",
      onClick: handleEditProfile,
    },
    {
      label: "Active Resume Skills",
      value: `${latestResume?.skills.length ?? 0}`,
      explanation: latestResume
        ? `Extracted from ${latestResume.fileName ?? latestResume.title}.`
        : "Upload a PDF or DOCX resume to extract your baseline skills.",
      actionLabel: latestResume ? "Manage resume" : "Upload resume",
      onClick: () => navigate("/resume"),
    },
    {
      label: "Interview-Verified Skills",
      value: `${verifiedSkills.length}`,
      explanation:
        verifiedSkills.length > 0
          ? `${verifiedSkills.length} skills verified in rubric evaluations.`
          : "Complete a targeted mock interview to verify your resume claims.",
      actionLabel: "View skill evidence",
      onClick: () => navigate("/readiness"),
    },
  ];

  return (
    <ContentContainer size="lg" className="space-y-6">
      <PageHeader
        eyebrow="Candidate Account"
        title={user.name || "Candidate Profile"}
        description="Manage your target role, preferred work locations, and active resume baseline."
        primaryAction={
          <Button
            variant="primary"
            onClick={handleEditProfile}
            leftIcon={<Edit3 className="h-4 w-4" />}
          >
            Edit profile preferences
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/readiness")}>
            View readiness ledger
          </Button>
        }
      />

      {/* Actionable Profile Metrics (Label + Value + Explanation + Action) */}
      <section className="grid gap-4 sm:grid-cols-3">
        {profileMetrics.map((item) => (
          <Card
            key={item.label}
            padding="sm"
            className="flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-content-secondary">
                {item.label}
              </p>
              <p className="truncate text-xl font-semibold text-content-heading tabular-nums">
                {item.value}
              </p>
              <p className="text-xs leading-relaxed text-content-secondary">
                {item.explanation}
              </p>
            </div>
            <div className="border-t border-border pt-2.5">
              <button
                type="button"
                onClick={item.onClick}
                className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </section>

      {/* Candidate Details & Locations */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionCard
            title="Account & Role Preferences"
            description="Used to filter verified ATS postings and tailor mock interview difficulty."
            action={
              <Button variant="ghost" size="sm" onClick={handleEditProfile}>
                Edit
              </Button>
            }
          >
            <dl className="divide-y divide-border text-sm">
              <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                <dt className="inline-flex items-center gap-2 text-xs font-medium text-content-secondary">
                  <User className="h-3.5 w-3.5" />
                  <span>Full name</span>
                </dt>
                <dd className="font-medium text-content-heading">
                  {user.name || "Not provided"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="inline-flex items-center gap-2 text-xs font-medium text-content-secondary">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email address</span>
                </dt>
                <dd className="font-medium text-content-body">{user.email}</dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="inline-flex items-center gap-2 text-xs font-medium text-content-secondary">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Target role</span>
                </dt>
                <dd>
                  {user.targetRole ? (
                    <Badge tone="primary">{user.targetRole}</Badge>
                  ) : (
                    <span className="text-xs text-content-secondary">
                      Not configured
                    </span>
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="inline-flex items-center gap-2 text-xs font-medium text-content-secondary">
                  <Award className="h-3.5 w-3.5" />
                  <span>Experience level</span>
                </dt>
                <dd className="text-xs font-medium text-content-heading">
                  {user.experienceLevel || "Not configured"}
                </dd>
              </div>

              <div className="space-y-2 pt-3">
                <dt className="inline-flex items-center gap-2 text-xs font-medium text-content-secondary">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Preferred locations</span>
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {user.preferredLocations &&
                  user.preferredLocations.length > 0 ? (
                    user.preferredLocations.map((loc: string) => (
                      <Badge key={loc} tone="neutral" size="sm">
                        {loc}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-content-secondary">
                      No preferred locations selected
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>

        {/* Skills & Resume Snapshot (Lazy-loaded) */}
        <div className="lg:col-span-6">
          <Suspense fallback={<SkillsEvidenceFallback />}>
            <ProfileSkillsEvidencePanel
              verifiedSkills={verifiedSkills}
              weakSkills={weakSkills}
              latestResume={latestResume}
              loading={resumesLoading || readinessLoading}
            />
          </Suspense>
        </div>
      </div>
    </ContentContainer>
  );
};

export default UserProfileCard;
