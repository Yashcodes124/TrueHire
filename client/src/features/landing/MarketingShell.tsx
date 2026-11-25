import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { ContentContainer } from "../../components/layout";
import {
  Button,
  ScrollProgressBar,
  Skeleton,
  ThemeToggle,
} from "../../components/ui";

export interface MarketingShellProps {
  children: React.ReactNode;
}

export const SUPPORT_EMAIL = "support@truehire.dev";

/**
 * Shared marketing frame for the Landing Page and Support/Contact page:
 * - Centered rounded container sitting cleanly inside a subtle outer viewport mat
 * - Floating, pill-shaped frosted navbar with TrueHire brand on left and links/actions on right
 * - Seamless unified canvas (no hard horizontal bands) and full multi-column website footer
 */
export const MarketingShell: React.FC<MarketingShellProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const sectionHref = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <div className="min-h-screen bg-[var(--bg-outer-mat)] px-2 py-2 text-content-body theme-surface-transition sm:px-5 sm:py-5 lg:px-7 lg:py-6">
      <ScrollProgressBar />

      {/* Centered Rounded Page Container */}
      <div className="relative mx-auto max-w-[1380px] overflow-x-clip rounded-2xl border border-border/80 bg-canvas shadow-elevated theme-surface-transition sm:rounded-3xl">
        {/* Floating Pill Navbar */}
        <div className="sticky top-3 z-40 px-2.5 pt-3 sm:top-5 sm:px-6 sm:pt-5">
          <header
            aria-label="Primary navigation"
            className="mx-auto flex h-12 max-w-[1160px] items-center justify-between gap-2 rounded-full border border-border-strong/70 bg-surface/85 px-2.5 shadow-md backdrop-blur-xl theme-surface-transition sm:h-14 sm:gap-3 sm:px-4"
          >
            {/* Left: Brand Lockup */}
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2 rounded-full pl-1 pr-1.5 font-display text-[15px] font-bold tracking-tight text-content-heading whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:gap-2.5 sm:pr-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-mono text-[11px] font-semibold text-primary-foreground shadow-xs">
                TH
              </span>
              <span>TrueHire</span>
            </Link>

            {/* Right: Navigation Links + Actions inside the same pill */}
            <div className="flex min-w-0 items-center gap-1 sm:gap-3 lg:gap-5">
              <nav
                aria-label="Site sections"
                className="hidden items-center gap-5 text-[13.5px] font-medium text-content-secondary md:flex"
              >
                <a
                  href={sectionHref("#workspace-preview")}
                  className="whitespace-nowrap transition-colors duration-150 hover:text-content-heading"
                >
                  Workspace
                </a>
                <a
                  href={sectionHref("#how-it-works")}
                  className="whitespace-nowrap transition-colors duration-150 hover:text-content-heading"
                >
                  How it works
                </a>
                <a
                  href={sectionHref("#features")}
                  className="whitespace-nowrap transition-colors duration-150 hover:text-content-heading"
                >
                  Capabilities
                </a>
                <Link
                  to="/support"
                  className={`whitespace-nowrap transition-colors duration-150 hover:text-content-heading ${
                    location.pathname === "/support"
                      ? "text-content-heading"
                      : ""
                  }`}
                >
                  Support
                </Link>
              </nav>

              <div
                aria-hidden="true"
                className="hidden h-4 w-px bg-border md:block"
              />

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <ThemeToggle
                  variant="compact"
                  className="!rounded-full"
                />

                {isLoading ? (
                  <Skeleton className="h-8 w-24 rounded-full" />
                ) : isAuthenticated || user ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/jobs")}
                      className="hidden !rounded-full sm:inline-flex"
                    >
                      Explore Jobs
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate("/dashboard")}
                      className="!rounded-full px-3.5 sm:px-4"
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/login")}
                      className="!rounded-full px-2.5 text-xs sm:px-3.5 sm:text-sm"
                    >
                      Sign in
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate("/register")}
                      className="!rounded-full px-3.5 text-xs sm:px-4 sm:text-sm"
                      rightIcon={
                        <ArrowRight className="hidden h-3.5 w-3.5 sm:inline-block" />
                      }
                    >
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* Page Main Content */}
        <main>{children}</main>

        {/* Full Website Multi-Column Footer */}
        <footer className="mt-10 bg-surface/50 pt-14 pb-10 theme-surface-transition">
          <ContentContainer
            size="xl"
            padded={false}
            className="px-5 sm:px-8 lg:px-12"
          >
            <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-12">
              {/* Brand Column */}
              <div className="space-y-4 lg:col-span-5">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2.5 font-display text-base font-bold tracking-tight text-content-heading"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-mono text-[11px] font-semibold text-primary-foreground">
                    TH
                  </span>
                  <span>TrueHire</span>
                </Link>
                <p className="max-w-sm text-sm leading-relaxed text-content-secondary">
                  Transparent engineering job discovery and evidence-backed
                  interview readiness. Match your resume to verified company
                  postings and close skill gaps with real rubric feedback.
                </p>
                <div className="pt-1">
                  <ThemeToggle variant="segmented" />
                </div>
              </div>

              {/* Product Links */}
              <div className="space-y-3 lg:col-span-2">
                <h2 className="font-display text-xs font-semibold text-content-heading">
                  Product
                </h2>
                <ul className="space-y-2.5 text-sm text-content-secondary">
                  <li>
                    <a
                      href={sectionHref("#workspace-preview")}
                      className="transition-colors hover:text-content-heading"
                    >
                      Workspace preview
                    </a>
                  </li>
                  <li>
                    <a
                      href={sectionHref("#how-it-works")}
                      className="transition-colors hover:text-content-heading"
                    >
                      How it works
                    </a>
                  </li>
                  <li>
                    <a
                      href={sectionHref("#features")}
                      className="transition-colors hover:text-content-heading"
                    >
                      Capabilities
                    </a>
                  </li>
                  <li>
                    <Link
                      to="/jobs"
                      className="transition-colors hover:text-content-heading"
                    >
                      Verified job boards
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Workspace Links */}
              <div className="space-y-3 lg:col-span-2">
                <h2 className="font-display text-xs font-semibold text-content-heading">
                  Workspace
                </h2>
                <ul className="space-y-2.5 text-sm text-content-secondary">
                  <li>
                    <Link
                      to="/dashboard"
                      className="transition-colors hover:text-content-heading"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/resume"
                      className="transition-colors hover:text-content-heading"
                    >
                      Resume analysis
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/radar"
                      className="transition-colors hover:text-content-heading"
                    >
                      Role-Fit Radar
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/interviews"
                      className="transition-colors hover:text-content-heading"
                    >
                      Mock interviews
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support & Contact Column */}
              <div className="space-y-3 lg:col-span-3">
                <h2 className="font-display text-xs font-semibold text-content-heading">
                  Support &amp; Contact
                </h2>
                <ul className="space-y-2.5 text-sm text-content-secondary">
                  <li>
                    <Link
                      to="/support"
                      className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary-hover"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Contact Support</span>
                    </Link>
                  </li>
                  <li>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="font-mono text-xs transition-colors hover:text-content-heading"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </li>
                  <li>
                    <Link
                      to="/login"
                      className="transition-colors hover:text-content-heading"
                    >
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="transition-colors hover:text-content-heading"
                    >
                      Create free account
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quiet Legal / Copyright Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-content-secondary">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span>© {new Date().getFullYear()} TrueHire. All rights reserved.</span>
                <span aria-hidden="true" className="text-border-strong">·</span>
                <span>
                  Built by{" "}
                  <span className="font-medium text-content-heading">
                    Yashwanth
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <Link
                  to="/support"
                  className="transition-colors hover:text-content-heading"
                >
                  Support
                </Link>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=TrueHire%20Feedback`}
                  className="transition-colors hover:text-content-heading"
                >
                  Share feedback
                </a>
                <Link
                  to="/jobs"
                  className="transition-colors hover:text-content-heading"
                >
                  Explore Jobs
                </Link>
              </div>
            </div>
          </ContentContainer>
        </footer>
      </div>
    </div>
  );
};
