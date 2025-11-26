// components/drug-safety/DrugSafetyModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Clock, XCircle, Pill, ChevronLeft, FileText, AlertTriangle, Activity, Loader2, CheckCircle } from 'lucide-react';
import { DrugSafetyModalProps } from '@/types/drugSafety';
import { prepareChartData } from './types';

// Import all the section components
import DrugOverviewSection from './DrugOverviewSection';
import SafetyStatisticsSection from './SafetyStatisticsSection';
import SeverityBreakdownSection from './SeverityBreakdownSection';
import AdverseEventsSection from './AdverseEventsSection';
import AdverseEventsDetail from './AdverseEventsDetail';
import CompactProgressIndicator from './ProgressIndicator';

type ViewMode = 'overview' | 'adverseEvents';
type TabMode = 'clinical' | 'drugs';

// Skeleton components for loading states
const SkeletonText = ({ lines = 3, className = "" }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i}
        className={`h-4 bg-gray-200 rounded animate-pulse ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

const SkeletonCard = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center mb-4">
      <Icon className="w-5 h-5 mr-2 text-gray-300" />
      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
    </div>
    <SkeletonText lines={4} />
  </div>
);

const SkeletonDrugCard = () => (
  <div className="space-y-8">
    {/* Drug Overview Skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <Pill className="w-5 h-5 mr-2 text-gray-300" />
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
        </div>
      </div>
    </div>

    {/* Safety Statistics Skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-20 mx-auto animate-pulse" />
          </div>
        ))}
      </div>
    </div>

    {/* Chart Skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  </div>
);

const DrugSafetyModal: React.FC<DrugSafetyModalProps> = ({
  isOpen,
  onClose,
  safetyData,
  error,
  isLoading,
  progress,
  stageIndex,
  stageProgress,
  isStalled,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [tabMode, setTabMode] = useState<TabMode>('clinical');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Safe data accessors with filtering for drugs with adverse events
  const allDrugAnalyses = safetyData?.safety_analysis?.drug_analyses || [];
  // Filter out drugs with 0 adverse events
  const drugAnalyses = allDrugAnalyses.filter(drug => {
    const adverseEventsData = drug?.safety_data?.adverse_events_data;
    return adverseEventsData && adverseEventsData.total_cases > 0;
  });
  const currentDrug = drugAnalyses[activeTabIndex] || null;
  const totalDrugs = drugAnalyses.length || 0;
  
  // Check if no drugs were found or all drugs have 0 adverse events
  const noDrugsFound = safetyData && (!safetyData.extraction_result?.drugs_found || 
                       safetyData.extraction_result?.total_drugs === 0 ||
                       drugAnalyses.length === 0) &&
                       safetyData.message === "No drugs found in medical text - no safety analysis performed";
  
  // Prepare chart data for the current drug
  const chartData = prepareChartData(currentDrug);
  
  // View mode handlers
  const handleViewAdverseEvents = () => {
    setViewMode('adverseEvents');
  };
  
  const handleBackToOverview = () => {
    setViewMode('overview');
  };

  // Tab mode handlers
  const handleTabModeChange = (mode: TabMode) => {
    setTabMode(mode);
    if (mode === 'clinical') {
      setViewMode('overview');
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[9999] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Drug Safety Analysis</h2>
              
              {/* Loading indicator in header */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              )}
              
             
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Main Tab Navigation */}
          <div className="px-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => handleTabModeChange('clinical')}
                disabled={isLoading}
                className={`py-3 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors
                  ${tabMode === 'clinical' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Clinical Overview</span>
                </div>
              </button>
              
              {(drugAnalyses.length > 0 || isLoading) && (
                <button
                  onClick={() => handleTabModeChange('drugs')}
                  disabled={isLoading}
                  className={`py-3 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors
                    ${tabMode === 'drugs' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    <span>
                      Drug Information {isLoading ? '' : `(${drugAnalyses.length})`}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Drug Sub-navigation - show skeleton when loading */}
            {tabMode === 'drugs' && (
              <>
                {viewMode === 'adverseEvents' && currentDrug && !isLoading && (
                  <div className="flex items-center gap-2 px-6 py-3 text-sm bg-gray-50">
                    <button 
                      onClick={handleBackToOverview}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Overview
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600">
                      Adverse Events: {currentDrug.drug_name}
                    </span>
                  </div>
                )}

                {viewMode === 'overview' && (
                  <div className="px-6 bg-gray-50">
                    <nav className="flex space-x-4 overflow-x-auto py-3" aria-label="Drug tabs">
                      {isLoading ? (
                        // Skeleton drug tabs
                        Array.from({ length: 2 }).map((_, index) => (
                          <div 
                            key={index}
                            className="py-2 px-4 bg-gray-200 rounded-md animate-pulse"
                          >
                            <div className="flex items-center gap-1">
                              <Pill className="w-4 h-4 text-gray-300" />
                              <div className="h-4 bg-gray-300 rounded w-20" />
                            </div>
                          </div>
                        ))
                      ) : (
                        drugAnalyses.map((drug, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveTabIndex(index)}
                            className={`py-2 px-4 text-sm font-medium rounded-md focus:outline-none whitespace-nowrap transition-colors
                              ${activeTabIndex === index 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                          >
                            <div className="flex items-center gap-1">
                              <Pill className="w-4 h-4" />
                              <span>
                                {drug.drug_name}
                                {drug.is_primary && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                                    Primary
                                  </span>
                                )}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Compact Progress Indicator - only show when loading and no error */}
          <CompactProgressIndicator 
            isVisible={isLoading && !error} 
            hasError={!!error}
            progress={progress}
            stageIndex={stageIndex}
            stageProgress={stageProgress}
            isStalled={isStalled}
          />

          {error && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 text-orange-800">
                <Shield className="w-4 h-4" />
                <span className="font-medium">API Connection Note</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Error: {error}
              </p>
            </div>
          )}

          {/* No Drugs Found Notification */}
          {noDrugsFound && !isLoading && !error && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6">
              <div className="flex items-center gap-3 text-green-800 mb-3">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium text-lg">No Drug Safety Concerns Detected</span>
              </div>
              <p className="text-green-700 mb-2">
                Our analysis did not identify any drugs or medications mentioned in the medical text provided.
              </p>
              <p className="text-sm text-green-600">
                Since no drugs were detected, no safety analysis was performed. This is a positive result indicating no potential drug-related safety concerns in the current conversation.
              </p>
            </div>
          )}

          {/* Loading State - Show skeletons instead of content */}
          {isLoading && !error && (
            <>
              {tabMode === 'clinical' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard title="General Safety Assessment" icon={Shield} />
                    <SkeletonCard title="Toxicity Analysis" icon={AlertTriangle} />
                  </div>
                  
                  {/* Clinical Recommendation Skeleton */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                      <FileText className="w-5 h-5 mr-2 text-gray-300" />
                      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                    </div>
                    <SkeletonText lines={3} />
                  </div>

                  <SkeletonCard title="Adverse Events Interpretation" icon={Activity} />
                  <SkeletonCard title="Drug Interaction Analysis" icon={Pill} />
                </div>
              )}

              {tabMode === 'drugs' && (
                <SkeletonDrugCard />
              )}
            </>
          )}

          {/* Actual Content - Only show when not loading and drugs were found */}
          {!isLoading && safetyData && !noDrugsFound && (
            <>
              {/* Clinical Overview Tab */}
              {tabMode === 'clinical' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Safety Assessment */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-green-600" />
                        General Safety Assessment
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{safetyData.general_safety}</p>
                    </div>
                    
                    {/* Toxicity Analysis */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                        Toxicity Analysis
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{safetyData.toxicity_analysis}</p>
                    </div>
                  </div>

                  {/* Clinical Recommendation - Full Width */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Clinical Recommendation
                    </h3>
                    <p className="text-blue-800 leading-relaxed">{safetyData.clinical_recommendation}</p>
                  </div>

                  {/* Additional Clinical Insights */}
                  {safetyData.adverse_events_interpretation && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-purple-600" />
                        Adverse Events Interpretation
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{safetyData.adverse_events_interpretation}</p>
                    </div>
                  )}

                  {safetyData.drug_interaction_analysis_interpretation && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Pill className="w-5 h-5 mr-2 text-orange-600" />
                        Drug Interaction Analysis
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{safetyData.drug_interaction_analysis_interpretation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Drug Information Tab Content */}
              {tabMode === 'drugs' && currentDrug && (
                <>
                  {viewMode === 'overview' && (
                    <div className="space-y-8">
                      {/* Drug Overview */}
                      <DrugOverviewSection drug={currentDrug} />
                      
                      {/* Safety Statistics */}
                      <SafetyStatisticsSection drug={currentDrug} />
                    
                      {/* Severity Breakdown */}
                      <SeverityBreakdownSection drug={currentDrug} />
                      
                      {/* Adverse Events Preview */}
                      <AdverseEventsSection 
                        drug={currentDrug} 
                        chartData={chartData}
                        onViewDetails={handleViewAdverseEvents}
                      />
                    </div>
                  )}

                  {viewMode === 'adverseEvents' && (
                    <AdverseEventsDetail 
                      drug={currentDrug}
                      chartData={chartData}
                    />
                  )}
                </>
              )}


            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-3 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              ) : (
                drugAnalyses.length > 0 ? (
                  <span>
                    {drugAnalyses.length} drug{drugAnalyses.length !== 1 ? 's' : ''} with adverse events analyzed
                  </span>
                ) : safetyData?.extraction_result?.total_drugs && (
                  <span>
                    {safetyData.extraction_result.total_drugs} drug{safetyData.extraction_result.total_drugs !== 1 ? 's' : ''} analyzed (no adverse events found)
                  </span>
                )
              )}

            </div>
            <div className="text-xs text-gray-500">
              Data sources: FDA FAERS, FDA Drug Labeling, RxNorm
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(modalContent, document.body);
};

export default DrugSafetyModal;