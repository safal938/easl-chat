// components/drug-safety/ClinicalInsightsSection.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import { SafetyAnalysis } from '@/types/drugSafety';

interface ClinicalInsightsSectionProps {
  safetyData: SafetyAnalysis;
}

const ClinicalInsightsSection: React.FC<ClinicalInsightsSectionProps> = ({ safetyData }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Safety Assessment</h3>
          <p className="text-gray-700 leading-relaxed">{safetyData.general_safety}</p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Toxicity Analysis</h3>
          <p className="text-gray-700 leading-relaxed">{safetyData.toxicity_analysis}</p>
        </div>
      </div>

      {/* Clinical Recommendation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Clinical Recommendation
        </h3>
        <p className="text-blue-800 leading-relaxed">{safetyData.clinical_recommendation}</p>
      </div>
    </>
  );
};

export default ClinicalInsightsSection;