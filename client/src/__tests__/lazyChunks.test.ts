import { describe, expect, it } from "vitest";

describe("Dashboard & Profile lazy-loaded component chunks", () => {
  it("resolves all dashboard lazy sub-modules cleanly", async () => {
    const [
      dashboardPage,
      readinessPanel,
      skillProfileHub,
      analyticsCharts,
      activitySection,
    ] = await Promise.all([
      import("../features/dashboard/DashboardPage"),
      import("../features/readiness/ReadinessPanel"),
      import("../features/dashboard/DashboardSkillProfileHub"),
      import("../features/dashboard/DashboardAnalyticsCharts"),
      import("../features/dashboard/DashboardActivitySection"),
    ]);

    expect(typeof dashboardPage.DashboardPage).toBe("function");
    expect(typeof readinessPanel.ReadinessPanel).toBe("function");
    expect(typeof skillProfileHub.DashboardSkillProfileHub).toBe("function");
    expect(typeof analyticsCharts.DashboardAnalyticsCharts).toBe("function");
    expect(typeof activitySection.DashboardActivitySection).toBe("function");
  });

  it("resolves all profile and auth lazy route/sub-modules cleanly", async () => {
    const [
      userProfileCard,
      skillsEvidencePanel,
      profileSetupForm,
      locationsSection,
      onboardingWizard,
      loginForm,
      registerForm,
    ] = await Promise.all([
      import("../features/auth/UserProfileCard"),
      import("../features/auth/ProfileSkillsEvidencePanel"),
      import("../features/auth/ProfileSetupForm"),
      import("../features/auth/ProfileLocationsSection"),
      import("../features/auth/OnboardingWizard"),
      import("../features/auth/LoginForm"),
      import("../features/auth/RegisterForm"),
    ]);

    expect(typeof userProfileCard.UserProfileCard).toBe("function");
    expect(typeof skillsEvidencePanel.ProfileSkillsEvidencePanel).toBe("function");
    expect(typeof profileSetupForm.ProfileSetupForm).toBe("function");
    expect(typeof locationsSection.ProfileLocationsSection).toBe("function");
    expect(typeof onboardingWizard.OnboardingWizard).toBe("function");
    expect(typeof loginForm.LoginForm).toBe("function");
    expect(typeof registerForm.RegisterForm).toBe("function");
  });
});
