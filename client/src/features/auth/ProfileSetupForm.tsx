import React, { Suspense, lazy, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "./useAuth";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Button,
  ErrorState,
  Input,
  SectionCard,
  Select,
  Skeleton,
  Toast,
} from "../../components/ui/Primitives";

const ProfileLocationsSection = lazy(() =>
  import("./ProfileLocationsSection").then((m) => ({
    default: m.ProfileLocationsSection,
  })),
);

const LocationsFallback: React.FC = () => (
  <div className="space-y-3 border-t border-border pt-4" aria-busy="true">
    <Skeleton className="h-4 w-40" />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 5 }).map((_, idx) => (
        <Skeleton key={idx} className="h-8 w-24" />
      ))}
    </div>
    <Skeleton className="h-10 w-full" />
  </div>
);

export interface ProfileSetupFormProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const ROLE_SUGGESTIONS = [
  "Backend Engineer",
  "Full-Stack Engineer",
  "Frontend Engineer",
  "Software Engineer",
  "DevOps / Cloud Engineer",
  "Data Engineer",
];

const EXPERIENCE_LEVELS = [
  { value: "Entry-Level (0-1 years)", label: "Entry-Level (0–1 years)" },
  { value: "Junior (1-2 years)", label: "Junior (1–2 years)" },
  { value: "Mid-Level (2-5 years)", label: "Mid-Level (2–5 years)" },
  { value: "Senior (5+ years)", label: "Senior (5+ years)" },
];

export const ProfileSetupForm: React.FC<ProfileSetupFormProps> = ({
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState<string>(user?.name ?? "");
  const [targetRole, setTargetRole] = useState<string>(
    user?.targetRole ?? "Backend Engineer",
  );
  const [experienceLevel, setExperienceLevel] = useState<string>(
    user?.experienceLevel ?? "Mid-Level (2-5 years)",
  );
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    user?.preferredLocations?.length
      ? user.preferredLocations
      : ["Bengaluru", "Remote"],
  );
  const [customLocation, setCustomLocation] = useState("");

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const toggleLocation = (loc: string) => {
    setPreferredLocations((prev) =>
      prev.includes(loc) ? prev.filter((item) => item !== loc) : [...prev, loc],
    );
  };

  const handleAddLocation = () => {
    const trimmed = customLocation.trim();
    if (!trimmed) return;
    if (!preferredLocations.includes(trimmed)) {
      setPreferredLocations((prev) => [...prev, trimmed]);
    }
    setCustomLocation("");
  };

  const handleRemoveLocation = (loc: string) => {
    setPreferredLocations((prev) => prev.filter((item) => item !== loc));
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate("/profile");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    if (!targetRole.trim()) {
      setFieldError("Please enter a target engineering role.");
      return;
    }

    setIsSaving(true);
    try {
      if (typeof updateProfile === "function") {
        await updateProfile({
          name: name.trim() || undefined,
          targetRole: targetRole.trim(),
          experienceLevel,
          preferredLocations,
        });
      }
      setSavedToast(true);
      if (onComplete) {
        onComplete();
      } else {
        setTimeout(() => navigate("/profile"), 400);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not save your profile preferences. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ContentContainer size="md" className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Profile", href: "/profile" },
          { label: "Edit Preferences" },
        ]}
        eyebrow="Candidate Settings"
        title="Edit Profile Preferences"
        description="Configure your target engineering role, seniority level, and preferred locations for job matching and mock interviews."
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to profile
          </Button>
        }
      />

      {savedToast && (
        <Toast
          tone="success"
          title="Profile preferences saved"
          description="Your job matching and interview settings have been updated."
        />
      )}

      {submitError && (
        <ErrorState title="Unable to save profile" message={submitError} />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <SectionCard
          title="Role & Location Preferences"
          description="These settings personalize your recommended roles and mock interview questions."
          footer={
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Save preferences
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <Input
              label="Full name"
              placeholder="Your name"
              value={name}
              disabled={isSaving}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="space-y-2.5">
              <Input
                label="Target engineering role"
                placeholder="e.g., Backend Engineer"
                value={targetRole}
                disabled={isSaving}
                error={fieldError ?? undefined}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                helperText="Select a suggested role below or type a custom title."
              />

              <div className="flex flex-wrap gap-2">
                {ROLE_SUGGESTIONS.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant={targetRole === role ? "primary" : "outline"}
                    size="sm"
                    disabled={isSaving}
                    onClick={() => {
                      setTargetRole(role);
                      if (fieldError) setFieldError(null);
                    }}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>

            <Select
              label="Experience level"
              value={experienceLevel}
              disabled={isSaving}
              options={EXPERIENCE_LEVELS}
              onChange={(e) => setExperienceLevel(e.target.value)}
            />

            <Suspense fallback={<LocationsFallback />}>
              <ProfileLocationsSection
                preferredLocations={preferredLocations}
                customLocation={customLocation}
                disabled={isSaving}
                onToggleLocation={toggleLocation}
                onCustomLocationChange={setCustomLocation}
                onAddLocation={handleAddLocation}
                onRemoveLocation={handleRemoveLocation}
              />
            </Suspense>
          </div>
        </SectionCard>
      </form>
    </ContentContainer>
  );
};

export default ProfileSetupForm;
