import React from "react";
import { useNavigate } from "react-router-dom";
import type { BarDatum, DonutDatum } from "../../lib/chartMath";
import {
  DonutDistributionChart,
  SegmentedBarChart,
} from "../../components/ui/Charts";
import { Button, SectionCard } from "../../components/ui/Primitives";

export interface DashboardAnalyticsChartsProps {
  skillEvidenceDonut: DonutDatum[];
  pipelineFunnelData: BarDatum[];
  readinessScore: number;
  metricsLoading: boolean;
  appsLoading: boolean;
}

export const DashboardAnalyticsCharts: React.FC<
  DashboardAnalyticsChartsProps
> = ({
  skillEvidenceDonut,
  pipelineFunnelData,
  readinessScore,
  metricsLoading,
  appsLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <SectionCard
          eyebrow="Skill Verification Breakdown"
          title="Evidence Composition"
          description="Balance between interview-verified strengths, unvalidated resume claims, and priority gaps."
          loading={metricsLoading}
        >
          <DonutDistributionChart
            data={skillEvidenceDonut}
            centerValue={`${readinessScore}%`}
            centerLabel="Readiness"
          />
        </SectionCard>
      </div>

      <div className="lg:col-span-6">
        <SectionCard
          eyebrow="Pipeline Velocity"
          title="Application Funnel"
          description="Distribution of your tracked engineering roles across hiring stages."
          loading={appsLoading}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/applications")}
            >
              Open tracker
            </Button>
          }
        >
          <SegmentedBarChart items={pipelineFunnelData} valueSuffix=" roles" />
        </SectionCard>
      </div>
    </div>
  );
};

export default DashboardAnalyticsCharts;
