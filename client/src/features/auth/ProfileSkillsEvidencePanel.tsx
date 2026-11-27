import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import type { ReadinessSkill } from "../readiness/readinessApi";
import type { ResumeSummary } from "../resume/types";
import {
  Badge,
  Button,
  EmptyState,
  SectionCard,
  SkillBadge,
} from "../../components/ui/Primitives";

export interface ProfileSkillsEvidencePanelProps {
  verifiedSkills: ReadinessSkill[];
  weakSkills: ReadinessSkill[];
  latestResume?: ResumeSummary;
  loading: boolean;
}

export const ProfileSkillsEvidencePanel: React.FC<
  ProfileSkillsEvidencePanelProps
> = ({ verifiedSkills, weakSkills, latestResume, loading }) => {
  const navigate = useNavigate();

  return (
    <SectionCard
      title="Skills & Evidence Summary"
      description="Snapshot of your interview-verified and resume-extracted skills."
      loading={loading}
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate("/skills")}>
          Full skill ledger
        </Button>
      }
    >
      <div className="space-y-4">
        {verifiedSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-content-heading">
              Verified in Mock Interviews ({verifiedSkills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {verifiedSkills.map((item: ReadinessSkill) => (
                <SkillBadge
                  key={item.skill}
                  skill={item.skill}
                  level="VERIFIED"
                />
              ))}
            </div>
          </div>
        )}

        {weakSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-content-heading">
              Flagged for Practice ({weakSkills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {weakSkills.map((item: ReadinessSkill) => (
                <SkillBadge key={item.skill} skill={item.skill} level="WEAK" />
              ))}
            </div>
          </div>
        )}

        {latestResume ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-content-heading">
                Extracted from Active Resume ({latestResume.skills.length})
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-content-secondary">
                <FileText className="h-3 w-3" />
                {latestResume.fileName ?? latestResume.title}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {latestResume.skills.slice(0, 12).map((skill: string) => (
                <SkillBadge key={skill} skill={skill} level="EXTRACTED" />
              ))}
              {latestResume.skills.length > 12 && (
                <Badge tone="neutral" size="sm">
                  +{latestResume.skills.length - 12} more
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No active resume"
            description="Upload a resume to populate your baseline technical skills."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/resume")}
              >
                Upload resume
              </Button>
            }
          />
        )}
      </div>
    </SectionCard>
  );
};

export default ProfileSkillsEvidencePanel;
