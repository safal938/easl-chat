// components/drug-safety/DrugListSection.tsx
import React from 'react';
import { Pill, ChevronRight, Shield } from 'lucide-react';
import { SafetyAnalysis, DrugAnalysis } from '@/types/drugSafety';
import { getAdverseEventsData } from './types';

interface DrugListSectionProps {
  safetyData: SafetyAnalysis;
  onSelectDrug: (index: number) => void;
}

const DrugListSection: React.FC<DrugListSectionProps> = ({ 
  safetyData, 
  onSelectDrug 
}) => {
  const { extraction_result, safety_analysis } = safetyData;
  const drugAnalyses = safety_analysis?.drug_analyses || [];
  
  if (!extraction_result?.drugs_found || drugAnalyses.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <Shield className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-yellow-700 mb-1">No Drugs Detected</h3>
        <p className="text-yellow-600">
          No pharmaceutical drugs were identified in the medical text.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center">
        <Pill className="w-5 h-5 mr-2" />
        Drugs Identified ({extraction_result.total_drugs})
      </h2>
      
      <div className="space-y-3">
        {drugAnalyses.map((drug, index) => {
          const adverseEvents = getAdverseEventsData(drug);
          const hasAdverseEvents = adverseEvents && adverseEvents.total_cases > 0;
          
          return (
            <button
              key={index}
              onClick={() => onSelectDrug(index)}
              className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${drug.is_primary ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Pill className={`w-5 h-5 ${drug.is_primary ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 capitalize">
                      {drug.drug_name}
                      {drug.drug_type && (
                        <span className="ml-2 text-sm text-gray-600">
                          ({drug.drug_type})
                        </span>
                      )}
                    </h3>
                    {drug.is_primary && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                        Primary Drug
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {hasAdverseEvents && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                      {adverseEvents?.total_cases} adverse events
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              {drug.context && (
                <p className="mt-2 text-sm text-gray-600 border-t border-gray-100 pt-2">
                  <span className="font-medium">Context:</span> {drug.context}
                </p>
              )}
            </button>
          );
        })}
      </div>
      
      {extraction_result.message && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-700">{extraction_result.message}</p>
        </div>
      )}
    </div>
  );
};

export default DrugListSection;