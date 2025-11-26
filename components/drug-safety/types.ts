// components/drug-safety/types.ts
// Internal component-specific types 

import { SafetyAnalysis, DrugAnalysis } from '@/types/drugSafety';

export interface ChartDataItem {
  name: string;
  fullName?: string;
  count?: number;  // Make count optional
  value?: number;  // Allow value as an alternative to count
  color?: string;
}

export interface ChartData {
  reactionData: ChartDataItem[];
  severityData: ChartDataItem[];
  ageData: ChartDataItem[];
  demographicData: ChartDataItem[];
  countryData: ChartDataItem[];
}

export interface DrugSafetyModalContentProps {
  safetyData: SafetyAnalysis;
  currentDrug: DrugAnalysis;
  chartData: ChartData;
  onViewAdverseEvents: () => void;
}

export interface AdverseEventsContentProps {
  currentDrug: DrugAnalysis;
  chartData: ChartData;
  onBackToOverview: () => void;
}

// Helper functions shared across components

export const getSafetyColor = (text: string) => {
  if (!text) return "text-gray-700";
  if (text.toLowerCase().includes("high risk") || 
      text.toLowerCase().includes("serious") || 
      text.toLowerCase().includes("severe")) {
    return "text-red-700";
  }
  if (text.toLowerCase().includes("moderate") || 
      text.toLowerCase().includes("caution")) {
    return "text-orange-700";
  }
  return "text-green-700";
};

export const getRiskLevel = (seriousnessRate: number) => {
  if (seriousnessRate >= 80) return { level: 'High', color: 'text-red-600 bg-red-50 border-red-200' };
  if (seriousnessRate >= 50) return { level: 'Moderate', color: 'text-orange-600 bg-orange-50 border-orange-200' };
  if (seriousnessRate >= 20) return { level: 'Low-Moderate', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
  return { level: 'Low', color: 'text-green-600 bg-green-50 border-green-200' };
};

// Helper functions for data access
export const getAdverseEventsData = (drug: DrugAnalysis | null) => {
  return drug?.safety_data?.adverse_events_data;
};

export const getSeverityData = (drug: DrugAnalysis | null) => {
  return drug?.safety_data?.adverse_events_data?.severity_analysis;
};

export const getDemographicData = (drug: DrugAnalysis | null) => {
  return drug?.safety_data?.adverse_events_data?.demographic_analysis;
};

export const getLabelingData = (drug: DrugAnalysis | null) => {
  return drug?.safety_data?.labeling_data;
};

// Function to prepare chart data from drug data
export const prepareChartData = (drug: DrugAnalysis | null): ChartData => {
  if (!drug) return { 
    reactionData: [], 
    severityData: [], 
    ageData: [], 
    demographicData: [], 
    countryData: [] 
  };
  
  const adverseEventsData = getAdverseEventsData(drug);
  if (!adverseEventsData) return { 
    reactionData: [], 
    severityData: [], 
    ageData: [], 
    demographicData: [], 
    countryData: [] 
  };
  
  // Reaction data
  const reactionData = Object.entries(adverseEventsData.frequency_analysis.top_reactions || {}).map(([name, count]) => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    fullName: name,
    count
  }));
  
  // Severity data - use value property instead of count
  const severityData = [
    { name: 'Deaths', value: adverseEventsData.severity_analysis.death_cases, color: '#DC2626' },
    { name: 'Life Threatening', value: adverseEventsData.severity_analysis.life_threatening_cases, color: '#EA580C' },
    { name: 'Hospitalization', value: adverseEventsData.severity_analysis.hospitalization_cases, color: '#D97706' },
    { name: 'Disability', value: adverseEventsData.severity_analysis.disability_cases, color: '#2563EB' },
  ].filter(item => item.value > 0);
  
  // Age data
  const ageData = Object.entries(adverseEventsData.demographic_analysis.age_group_distribution || {}).map(([name, count]) => ({
    name,
    count
  }));
  
  // Sex distribution
  const demographicData = Object.entries(adverseEventsData.demographic_analysis.sex_distribution || {}).map(([name, count]) => ({
    name,
    count
  }));
  
  // Country data
  const countryData = Object.entries(adverseEventsData.demographic_analysis.top_countries || {}).map(([name, count]) => ({
    name,
    count
  }));
  
  return {
    reactionData,
    severityData,
    ageData,
    demographicData,
    countryData
  };
};