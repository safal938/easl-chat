// components/drug-safety/DrugOverviewSection.tsx
import React from 'react';
import { Pill } from 'lucide-react';
import { DrugAnalysis } from '@/types/drugSafety';

interface DrugOverviewSectionProps {
  drug: DrugAnalysis;
}

const DrugOverviewSection: React.FC<DrugOverviewSectionProps> = ({ drug }) => {
  return (
    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Pill className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-blue-900 capitalize">
              {drug.drug_name}
              {drug.drug_type && (
                <span className="ml-2 text-sm text-blue-700">
                  ({drug.drug_type})
                </span>
              )}
            </h3>
            {drug.is_primary && (
              <span className="text-xs font-medium bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                Primary Drug
              </span>
            )}
          </div>
        </div>
        
      </div>
      
      {drug.context && (
        <div className="mt-2 p-3 bg-white rounded border border-blue-100">
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">Found in context:</span> {drug.context}
          </p>
        </div>
      )}
    </div>
  );
};

export default DrugOverviewSection;