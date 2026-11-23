import React from 'react';
import { InputPanel } from '../components/dashboard/InputPanel';
import { PipelineVisualizer } from '../components/dashboard/PipelineVisualizer';
import { PipelineOutputCard } from '../components/dashboard/PipelineOutputCard';
import { MetricsRow } from '../components/dashboard/MetricsRow';
import { RecentEventsTable } from '../components/dashboard/RecentEventsTable';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (Module 1: Sensor Interface) */}
        <div className="lg:col-span-5">
          <InputPanel />
        </div>

        {/* Right Column: Pipeline Stages (Module 2) + Output Card */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <PipelineVisualizer />
          <PipelineOutputCard />
        </div>
      </div>

      {/* Row of 4 Performance Metrics (Module 4) */}
      <MetricsRow />

      {/* Recent Events Table */}
      <RecentEventsTable />
    </div>
  );
};
