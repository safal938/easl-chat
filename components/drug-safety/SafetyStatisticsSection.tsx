// components/drug-safety/SafetyStatisticsSection.tsx
import React from 'react';
import { Activity, TrendingUp, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { DrugAnalysis } from '@/types/drugSafety';
import { getAdverseEventsData, getSeverityData, getRiskLevel } from './types';

interface SafetyStatisticsSectionProps {
  drug: DrugAnalysis;
}

const SafetyStatisticsSection: React.FC<SafetyStatisticsSectionProps> = ({ drug }) => {
  const adverseEventsData = getAdverseEventsData(drug);
  const severityData = getSeverityData(drug);
  const seriousnessRate = severityData?.seriousness_rate_percent || 0;
  const riskLevel = getRiskLevel(seriousnessRate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Total Adverse Events Reported</span>
          <div className="group relative">
            <Info className="w-4 h-4 text-blue-600 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64 border border-gray-200 shadow-lg">
              <div className="font-semibold mb-1">Adverse Events:</div>
              Any unfavorable symptom, sign, abnormal laboratory finding, or disease temporally associated with the use of a drug—even if the drug is not necessarily responsible.
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
            </div>
          </div>
        </div>
        <p className="text-2xl font-bold text-blue-900 mt-1">
          {adverseEventsData?.total_cases_in_database || 0}
        </p>
       
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">Total Adverse Reactions</span>
          <div className="group relative">
            <Info className="w-4 h-4 text-purple-600 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64 border border-gray-200 shadow-lg">
              <div className="font-semibold mb-1">Adverse Reaction:</div>
              An adverse event for which a causal relationship between the medicinal product and the event is at least a reasonable possibility (i.e., suspicion or attribution) rather than mere temporal association.
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
            </div>
          </div>
        </div>
        <p className="text-2xl font-bold text-purple-900 mt-1">
          {adverseEventsData?.frequency_analysis.total_reaction_reports || 0}
        </p>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-900">Total Serious Adverse Events Reported</span>
        </div>
        <p className="text-2xl font-bold text-orange-900 mt-1">
          {severityData?.serious_cases || 0}
        </p>
      </div>
    
    </div>
  );
};

export default SafetyStatisticsSection;