// components/drug-safety/SeverityBreakdownSection.tsx
import React from 'react';
import { Shield } from 'lucide-react';
import { DrugAnalysis } from '@/types/drugSafety';
import { getSeverityData } from './types';

interface SeverityBreakdownSectionProps {
  drug: DrugAnalysis;
}

const SeverityBreakdownSection: React.FC<SeverityBreakdownSectionProps> = ({ drug }) => {
  const severityData = getSeverityData(drug);
  
  if (!severityData) return null;
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
    Outcomes of Serious Adverse Events
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">
            {severityData.death_cases || 0}
          </p>
          <p className="text-sm text-gray-600">Deaths</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {severityData.life_threatening_cases || 0}
          </p>
          <p className="text-sm text-gray-600">Life Threatening</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {severityData.hospitalization_cases || 0}
          </p>
          <p className="text-sm text-gray-600">Hospitalization</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {severityData.disability_cases || 0}
          </p>
          <p className="text-sm text-gray-600">Disability</p>
        </div>
        
      </div>
    </div>
  );
};

export default SeverityBreakdownSection;