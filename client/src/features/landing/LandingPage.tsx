import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  Layers,
  MessageSquare,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { ContentContainer } from "../../components/layout";
import {
  AmbientBackdrop,
  AreaTrendChart,
  Badge,
  Button,
  Card,
  EDITORIAL_EASE,
  FeedbackCard,
  ProgressBar,
  RadarCompetencyChart,
  RequirementRow,
  ScoreRing,
  ScrollReveal,
  SkillBadge,
  SpotlightCard,
  StaggerGroup,
  StaggerItem,
  Tabs,
} from "../../components/ui";
import { MarketingShell } from "./MarketingShell";
import { HeroSignalShowcase } from "./hero3d/HeroSignalShowcase";

const PREVIEW_EVAL_RADAR = [
  { label: "Accuracy", value: 86 },
  { label: "Clarity", value: 82 },
  { label: "Trade-offs", value: 88 },
  { label: "Depth", value: 78 },
  { label: "Structure", value: 85 },
  { label: "Role Fit", value: 84 },
];

const PREVIEW_READINESS_TREND = [
  { label: "S1", value: 54, note: "Baseline resume" },
  { label: "S2", value: 61, note: "SQL mock" },
  { label: "S3", value: 68, note: "Node.js APIs" },
  { label: "S4", value: 74, note: "System trade-offs" },
  { label: "S5", value: 80, note: "API Auth verified" },
];

const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Upload your resume",
    description:
      "Upload a PDF or DOCX resume to extract your baseline technical skills and project experience.",
  },
  {
    number: "02",
    title: "Compare with real roles",
    description:
      "Check how your skills match verified company postings or paste any job description you want to evaluate.",
  },
  {
    number: "03",
    title: "Prioritize missing skills",
    description:
      "See which requirements you already meet and which gaps appear most often across your saved roles.",
  },
  {
    number: "04",
    title: "Practice and record evidence",
    description:
      "Complete a 15–60 minute targeted mock interview. Rubric scores update your skill profile automatically.",
  },
];

const CORE_FEATURES = [
  {
    icon: <FileText className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Editable resume skill extraction",
    description:
      "Parse PDF and DOCX resumes into structured skills that you can confirm, add to, or remove at any time.",
  },
  {
    icon: <Briefcase className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Verified ATS postings",
    description:
      "Browse engineering roles synced directly from official Greenhouse job boards with source links and sync timestamps.",
  },
  {
    icon: <Target className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Explainable requirement coverage",
    description:
      "Every match score shows the exact count of matched, weak, and missing requirements—never an unexplained percentage.",
  },
  {
    icon: <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Targeted mock interviews",
    description:
      "Run technical and behavioral sessions scoped to a specific job and the exact skills you need to prove.",
  },
  {
    icon: <Award className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Evidence-backed skill profile",
    description:
      "Track which skills are only claimed on your resume versus practiced or verified through interview evaluations.",
  },
  {
    icon: <Layers className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Application pipeline tracker",
    description:
      "Organize roles across Saved, Applied, Interviewing, Offer, and Rejected with match scores and gap notes attached.",
  },
];

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [previewTab, setPreviewTab] = useState<string>("match");

  const primaryDestination =
    isAuthenticated || user ? "/dashboard" : "/register";

  return (
    <MarketingShell>
      {/* Hero Section — Unified Canvas + New 3D Spatial Verification Stack */}
      <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-14 lg:pb-28">
        <AmbientBackdrop variant="hero" />

        <ContentContainer
          size="xl"
          padded={false}
          className="relative z-10 px-5 sm:px-8 lg:px-12"
        >
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Editorial Headline & Primary Actions */}
            <motion.div
              initial={{ opacity: 0.96, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: EDITORIAL_EASE }}
              className="space-y-6 lg:col-span-5"
            >
              <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-content-heading sm:text-4xl lg:text-[3.2rem] lg:leading-[1.06]">
                Know which requirements you meet before you apply.
              </h1>

              <p className="max-w-[50ch] text-[15.5px] leading-relaxed text-content-body sm:text-base">
                Upload your resume to inspect exact skill coverage on real
                engineering roles, prioritize your highest-frequency gaps, and
                practice targeted mock interviews that update your readiness
                profile.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(primaryDestination)}
                  className="!rounded-full px-6"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {isAuthenticated || user
                    ? "Go to Dashboard"
                    : "Start with your resume"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/jobs")}
                  className="!rounded-full px-5"
                >
                  Browse verified jobs
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 sm:gap-5">
                <div>
                  <p className="whitespace-nowrap font-mono text-sm font-semibold text-content-heading tabular-nums sm:text-base">
                    8 / 12
                  </p>
                  <p className="mt-1 text-xs leading-snug text-content-secondary">
                    Transparent coverage
                  </p>
                </div>
                <div>
                  <p className="whitespace-nowrap font-mono text-sm font-semibold text-content-heading tabular-nums sm:text-base">
                    15–60m
                  </p>
                  <p className="mt-1 text-xs leading-snug text-content-secondary">
                    Skill-scoped mocks
                  </p>
                </div>
                <div>
                  <p className="whitespace-nowrap font-mono text-sm font-semibold text-content-heading tabular-nums sm:text-base">
                    Direct ATS
                  </p>
                  <p className="mt-1 text-xs leading-snug text-content-secondary">
                    Official company boards
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: New 3D Spatial Verification Stack */}
            <motion.div
              initial={{ opacity: 0.96, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.05, ease: EDITORIAL_EASE }}
              className="lg:col-span-7"
            >
              <HeroSignalShowcase />
            </motion.div>
          </div>
        </ContentContainer>
      </section>

      {/* Swapped Interactive Workspace Preview — Seamless Flow, No Hard Section Dividers */}
      <section
        id="workspace-preview"
        className="scroll-mt-24 py-14 sm:py-20 lg:py-24"
      >
        <ContentContainer
          size="xl"
          padded={false}
          className="px-5 sm:px-8 lg:px-12"
        >
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Editorial Left Explanation */}
            <ScrollReveal
              direction="up"
              className="space-y-5 lg:col-span-4 lg:pt-2"
            >
              <h2 className="font-display text-2xl font-bold tracking-[-0.025em] text-content-heading sm:text-3xl lg:text-[2.15rem] lg:leading-[1.12]">
                Every interview updates your skill profile.
              </h2>
              <p className="text-sm leading-relaxed text-content-secondary sm:text-[15px]">
                Most job tools stop at a static resume keyword score. TrueHire
                connects your resume, role requirements, and interview feedback
                into one continuous evidence loop.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-xs font-medium text-content-secondary tabular-nums">
                    01
                  </span>
                  <p className="text-sm text-content-body">
                    Inspect exact matched, practiced, and missing requirements
                    before sending an application.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-xs font-medium text-content-secondary tabular-nums">
                    02
                  </span>
                  <p className="text-sm text-content-body">
                    Rank gaps by how often they appear across your saved
                    engineering postings.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-xs font-medium text-content-secondary tabular-nums">
                    03
                  </span>
                  <p className="text-sm text-content-body">
                    Turn rubric evaluations into verified proof that lifts your
                    match readiness.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Interactive 4-Stage Product Workspace Preview (Moved Down from Hero) */}
            <ScrollReveal direction="up" className="lg:col-span-8">
              <Card
                padding="none"
                className="overflow-hidden rounded-2xl border-border-strong/70 shadow-elevated"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-3 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-xs font-semibold text-content-heading">
                      Live Workspace Preview
                    </span>
                    <span className="font-mono text-[11px] text-content-secondary">
                      Backend Engineer · Sample Role
                    </span>
                  </div>
                  <span className="text-xs font-medium text-content-secondary">
                    Interactive walkthrough
                  </span>
                </div>

                <div className="p-4 sm:p-6">
                  <Tabs
                    activeTab={previewTab}
                    onChange={setPreviewTab}
                    items={[
                      {
                        id: "match",
                        label: "1. Role Match",
                        content: (
                          <div className="space-y-4">
                            <Card
                              muted
                              padding="sm"
                              className="flex flex-wrap items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-content-secondary">
                                  Requirement coverage
                                </p>
                                <p className="font-display text-base font-semibold text-content-heading">
                                  You meet 8 of 12 requirements for this role.
                                </p>
                                <p className="text-xs text-content-secondary">
                                  6 skills verified in interviews · 2 skills on
                                  resume · 4 gaps identified
                                </p>
                              </div>
                              <ScoreRing score={67} size={68} label="Match" />
                            </Card>

                            <div className="space-y-2.5">
                              <RequirementRow
                                skill="PostgreSQL"
                                status="MET"
                                evidence="Verified in technical mock interview (86/100)"
                              />
                              <RequirementRow
                                skill="TypeScript & Node.js"
                                status="PRACTICED"
                                evidence="Matched on resume + practiced in 1 session"
                              />
                              <RequirementRow
                                skill="API Authentication"
                                status="MISSING"
                                priority="high"
                                frequencyLabel="Appears in 7 saved jobs"
                              />
                            </div>
                          </div>
                        ),
                      },
                      {
                        id: "gaps",
                        label: "2. Skill Gaps",
                        content: (
                          <div className="space-y-3">
                            <Card muted padding="sm">
                              <p className="text-xs font-semibold text-content-heading">
                                Your strongest gap is API authentication. It
                                appears in 7 of your saved jobs.
                              </p>
                              <p className="mt-1 text-xs text-content-secondary">
                                Gaps are ranked by how frequently they appear
                                across your target roles.
                              </p>
                            </Card>
                            <RequirementRow
                              skill="API Authentication (OAuth2 / JWT)"
                              status="MISSING"
                              priority="high"
                              evidence="Required in 7 of 9 saved backend roles"
                            />
                            <RequirementRow
                              skill="Redis Distributed Caching"
                              status="WEAK"
                              priority="high"
                              evidence="Scored 48/100 in last interview — needs practice"
                            />
                            <RequirementRow
                              skill="Rate Limiting & Backpressure"
                              status="MISSING"
                              priority="medium"
                              evidence="Required in 4 of 9 saved backend roles"
                            />
                          </div>
                        ),
                      },
                      {
                        id: "interview",
                        label: "3. Evaluation",
                        content: (
                          <div className="grid gap-4 md:grid-cols-12 md:items-center">
                            <div className="md:col-span-5">
                              <RadarCompetencyChart
                                data={PREVIEW_EVAL_RADAR}
                                size={224}
                                title="Rubric"
                              />
                            </div>
                            <div className="md:col-span-7">
                              <FeedbackCard
                                title="Question 2 Evaluation · API Authentication"
                                score={84}
                                summary="Clear explanation of short-lived access tokens paired with rotating refresh tokens and revocation lists."
                                strengths={[
                                  "Explained token rotation and replay detection clearly.",
                                  "Addressed stateless vs. stateful revocation trade-offs.",
                                ]}
                                improvements={[
                                  "Specify cookie security flags (HttpOnly, SameSite, Secure) when storing refresh tokens.",
                                ]}
                              />
                            </div>
                          </div>
                        ),
                      },
                      {
                        id: "profile",
                        label: "4. Skill Profile",
                        content: (
                          <div className="space-y-4">
                            <Card muted padding="sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-content-heading">
                                    Your readiness improved by 6 points after
                                    your last interview.
                                  </p>
                                  <p className="text-xs text-content-secondary">
                                    API Authentication moved from Missing to
                                    Practiced.
                                  </p>
                                </div>
                                <Badge tone="success">+6 pts</Badge>
                              </div>
                            </Card>

                            <Card padding="sm" className="bg-canvas/50">
                              <AreaTrendChart
                                data={PREVIEW_READINESS_TREND}
                                height={132}
                                title="Readiness progression"
                              />
                            </Card>

                            <div className="space-y-2.5">
                              <ProgressBar
                                label="Backend APIs & Auth"
                                value={84}
                                tone="success"
                              />
                              <ProgressBar
                                label="Relational Databases"
                                value={78}
                                tone="primary"
                              />
                            </div>

                            <div className="flex flex-wrap gap-2 pt-0.5">
                              <SkillBadge
                                skill="PostgreSQL"
                                level="VERIFIED"
                              />
                              <SkillBadge
                                skill="API Authentication"
                                level="PRACTICED"
                              />
                              <SkillBadge
                                skill="TypeScript"
                                level="VERIFIED"
                              />
                              <SkillBadge skill="Redis Caching" level="WEAK" />
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </ContentContainer>
      </section>

      {/* How It Works — Clean Editorial Rhythm, Zero AI Kickers */}
      <section
        id="how-it-works"
        className="scroll-mt-24 py-14 sm:py-20 lg:py-24"
      >
        <ContentContainer
          size="xl"
          padded={false}
          className="px-5 sm:px-8 lg:px-12"
        >
          <ScrollReveal direction="up" className="max-w-2xl space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-[-0.025em] text-content-heading sm:text-3xl lg:text-[2.15rem] lg:leading-[1.12]">
              Four steps from resume upload to verified readiness.
            </h2>
            <p className="text-sm leading-relaxed text-content-secondary sm:text-[15px]">
              A straightforward workflow built for engineers preparing for
              specific roles—without guesswork or inflated percentages.
            </p>
          </ScrollReveal>

          <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((item, idx) => (
              <StaggerItem
                key={item.number}
                direction={idx % 2 === 0 ? "up" : "scale"}
                className="h-full"
              >
                <SpotlightCard
                  padding="md"
                  className="h-full rounded-2xl border-border/80"
                >
                  <span className="font-mono text-xs font-medium text-content-secondary tabular-nums">
                    {item.number}
                  </span>
                  <h3 className="mt-4 font-display text-[17px] font-semibold tracking-tight text-content-heading">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                    {item.description}
                  </p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </ContentContainer>
      </section>

      {/* Core Capabilities — Seamless Continuous Flow */}
      <section id="features" className="scroll-mt-24 py-14 sm:py-20 lg:py-24">
        <ContentContainer
          size="xl"
          padded={false}
          className="px-5 sm:px-8 lg:px-12"
        >
          <ScrollReveal direction="up" className="max-w-2xl space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-[-0.025em] text-content-heading sm:text-3xl lg:text-[2.15rem] lg:leading-[1.12]">
              Built for practical engineering preparation.
            </h2>
            <p className="text-sm leading-relaxed text-content-secondary sm:text-[15px]">
              Transparent matching, source-verified job postings, and
              non-fabricated resume tailoring.
            </p>
          </ScrollReveal>

          <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_FEATURES.map((feat, idx) => (
              <StaggerItem
                key={feat.title}
                direction={
                  idx % 3 === 0 ? "left" : idx % 3 === 2 ? "right" : "up"
                }
                className="h-full"
              >
                <SpotlightCard
                  padding="md"
                  className="group h-full rounded-2xl border-border/80"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/70 transition-colors duration-150 group-hover:border-primary/40 group-hover:bg-primary-soft">
                    {feat.icon}
                  </div>
                  <h3 className="mt-4 font-display text-[17px] font-semibold tracking-tight text-content-heading">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                    {feat.description}
                  </p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerGroup>

          {/* Technical Provenance Row */}
          <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <Card
                muted
                padding="sm"
                className="flex h-full items-start gap-3 rounded-xl"
              >
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    Non-Fabricated Tailoring
                  </p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    Rewrites are strictly bounded by your existing resume facts.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card
                muted
                padding="sm"
                className="flex h-full items-start gap-3 rounded-xl"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-status-success"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    Traceable Scores
                  </p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    Every score lists the exact skills matched and missing.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card
                muted
                padding="sm"
                className="flex h-full items-start gap-3 rounded-xl"
              >
                <Database
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    Resumable Sessions
                  </p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    Pause and resume mock interviews without losing answers.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card
                muted
                padding="sm"
                className="flex h-full items-start gap-3 rounded-xl"
              >
                <Code2
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    Official ATS Sources
                  </p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    Direct company board links and sync timestamps on every job.
                  </p>
                </div>
              </Card>
            </StaggerItem>
          </StaggerGroup>
        </ContentContainer>
      </section>

      {/* Final Call to Action — Clean Elevated Card, No AI Eyebrow */}
      <section className="relative py-12 sm:py-16 lg:py-20">
        <AmbientBackdrop variant="subtle" />
        <ContentContainer
          size="md"
          padded={false}
          className="relative z-10 px-5 sm:px-8 lg:px-12"
        >
          <ScrollReveal direction="scale">
            <Card
              padding="lg"
              className="rounded-2xl border-border-strong/70 text-center shadow-elevated"
            >
              <h2 className="font-display text-2xl font-bold tracking-[-0.025em] text-content-heading sm:text-3xl">
                See where you stand on your target roles.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-content-secondary sm:text-[15px]">
                Upload your resume to inspect your requirement coverage on real
                engineering jobs and practice targeted interviews.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(primaryDestination)}
                  className="!rounded-full px-6"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {isAuthenticated || user
                    ? "Open Dashboard"
                    : "Create your account"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/support")}
                  className="!rounded-full px-5"
                >
                  Contact support
                </Button>
              </div>
            </Card>
          </ScrollReveal>
        </ContentContainer>
      </section>
    </MarketingShell>
  );
};

export default LandingPage;
