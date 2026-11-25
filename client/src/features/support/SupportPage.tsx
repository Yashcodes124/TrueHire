import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react";
import { ContentContainer } from "../../components/layout";
import { Button, Card } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import { MarketingShell, SUPPORT_EMAIL } from "../landing/MarketingShell";

const TOPICS = [
  "Product feedback",
  "Bug report",
  "Feature request",
  "Account & access",
] as const;

type Topic = (typeof TOPICS)[number];

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function buildSupportMailtoHref(params: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): string {
  const subject = `[TrueHire · ${params.topic}] Message from ${params.name.trim()}`;
  const body = [
    `Name: ${params.name.trim()}`,
    `Reply-To: ${params.email.trim()}`,
    `Topic: ${params.topic}`,
    "",
    params.message.trim(),
  ].join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const SupportPage: React.FC = () => {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<Topic>("Product feedback");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedHref, setSubmittedHref] = useState<string | null>(null);

  const composedMailto = useMemo(
    () => buildSupportMailtoHref({ name, email, topic, message }),
    [name, email, topic, message],
  );

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!name.trim()) {
      next.name = "Please enter your name.";
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      next.email = "Please enter a valid email address so we can reply.";
    }
    if (message.trim().length < 10) {
      next.message = "Please share at least a sentence or two (10+ characters).";
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const href = buildSupportMailtoHref({ name, email, topic, message });
    setSubmittedHref(href);

    // Launch native mail client cleanly without window.open popups
    const link = document.createElement("a");
    link.href = href;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(
      "Email draft ready",
      `Your message to ${SUPPORT_EMAIL} is prepared in your mail client.`,
    );
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      toast.success("Copied email address", SUPPORT_EMAIL);
    } catch {
      toast.info("Direct support email", SUPPORT_EMAIL);
    }
  };

  const handleReset = () => {
    setSubmittedHref(null);
    setMessage("");
    setErrors({});
  };

  return (
    <MarketingShell>
      <section className="py-12 sm:py-16 lg:py-20">
        <ContentContainer
          size="xl"
          padded={false}
          className="px-5 sm:px-8 lg:px-12"
        >
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-content-secondary transition-colors hover:text-content-heading"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to TrueHire</span>
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
            {/* Left Column: Editorial Intro & Direct Mail Options */}
            <div className="space-y-6 lg:col-span-5">
              <div className="space-y-3">
                <h1 className="font-display text-3xl font-bold tracking-tight text-content-heading sm:text-4xl">
                  Share your thoughts or get support.
                </h1>
                <p className="text-base leading-relaxed text-content-secondary">
                  Have feedback on resume skill extraction, mock interview
                  rubrics, or a role you want supported? Send us a note directly
                  by email and we will follow up promptly.
                </p>
              </div>

              <Card padding="md" className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-content-heading">
                      Direct email
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-content-secondary">
                      {SUPPORT_EMAIL}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopyEmail()}
                    leftIcon={<Copy className="h-3.5 w-3.5" />}
                  >
                    Copy address
                  </Button>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=TrueHire%20Support`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-input px-3 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                  >
                    Open mail app
                  </a>
                </div>
              </Card>

              <div className="space-y-2 text-sm text-content-secondary">
                <p className="font-display text-sm font-semibold text-content-heading">
                  Helpful details to include
                </p>
                <p className="leading-relaxed">
                  For bug reports, mention the page you were on (such as Resume
                  upload, Role Match, or Live Interview) and what you expected
                  to happen.
                </p>
              </div>
            </div>

            {/* Right Column: Interactive Contact Form */}
            <div className="lg:col-span-7">
              <Card padding="lg" className="shadow-card">
                {submittedHref ? (
                  <div className="space-y-5 py-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-status-success-soft text-status-success">
                      <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="font-display text-xl font-semibold text-content-heading">
                        Your message is ready to send
                      </h2>
                      <p className="text-sm leading-relaxed text-content-secondary">
                        We opened your default email app addressed to{" "}
                        <span className="font-mono text-content-heading">
                          {SUPPORT_EMAIL}
                        </span>{" "}
                        with your note pre-filled. If your mail app didn&apos;t
                        launch automatically, use the button below.
                      </p>
                    </div>

                    <div className="rounded-input border border-border bg-muted/50 p-4 text-xs space-y-1.5">
                      <p className="font-medium text-content-heading">
                        {topic} · from {name} ({email})
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed text-content-secondary">
                        {message}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href={submittedHref}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover"
                      >
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        <span>Open in mail client</span>
                      </a>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                      >
                        Write another message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="flex items-center gap-2.5 pb-1">
                      <MessageSquare
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      <h2 className="font-display text-lg font-semibold text-content-heading">
                        Send a note by email
                      </h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="support-name"
                          className="block text-xs font-medium text-content-heading"
                        >
                          Your name
                        </label>
                        <input
                          id="support-name"
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) {
                              setErrors((prev) => ({ ...prev, name: undefined }));
                            }
                          }}
                          placeholder="Alex Rivera"
                          className="h-10 w-full px-3.5 text-sm"
                          aria-invalid={Boolean(errors.name)}
                        />
                        {errors.name && (
                          <p className="text-xs text-status-danger" role="alert">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="support-email"
                          className="block text-xs font-medium text-content-heading"
                        >
                          Email address
                        </label>
                        <input
                          id="support-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) {
                              setErrors((prev) => ({
                                ...prev,
                                email: undefined,
                              }));
                            }
                          }}
                          placeholder="alex@company.com"
                          className="h-10 w-full px-3.5 text-sm"
                          aria-invalid={Boolean(errors.email)}
                        />
                        {errors.email && (
                          <p className="text-xs text-status-danger" role="alert">
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <fieldset className="space-y-2">
                      <legend className="text-xs font-medium text-content-heading">
                        Topic
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {TOPICS.map((item) => {
                          const active = topic === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setTopic(item)}
                              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                active
                                  ? "border-primary bg-primary-soft text-primary"
                                  : "border-border bg-canvas text-content-secondary hover:border-border-strong hover:text-content-heading"
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="support-message"
                        className="block text-xs font-medium text-content-heading"
                      >
                        Your thoughts or question
                      </label>
                      <textarea
                        id="support-message"
                        rows={5}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (errors.message) {
                            setErrors((prev) => ({
                              ...prev,
                              message: undefined,
                            }));
                          }
                        }}
                        placeholder="Tell us what is working well, what felt unclear, or what you would like to see next..."
                        className="w-full resize-y px-3.5 py-2.5 text-sm leading-relaxed"
                        aria-invalid={Boolean(errors.message)}
                      />
                      {errors.message && (
                        <p className="text-xs text-status-danger" role="alert">
                          {errors.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-content-secondary">
                        Opens your mail app addressed to{" "}
                        <span className="font-mono text-content-body">
                          {SUPPORT_EMAIL}
                        </span>
                      </p>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="!rounded-full px-6"
                        rightIcon={<Send className="h-3.5 w-3.5" />}
                      >
                        Send via email
                      </Button>
                    </div>

                    {/* Hidden semantic preview href keeps mailto always computed */}
                    <span className="sr-only">{composedMailto}</span>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </ContentContainer>
      </section>
    </MarketingShell>
  );
};

export default SupportPage;
