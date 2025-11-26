// components/drug-safety/AdverseEventsSection.tsx
import React from 'react';
import { BarChart3, AlertTriangle, Users, Globe, Search, ChevronRight, Info } from 'lucide-react';
import { DrugAnalysis } from '@/types/drugSafety';
import { ChartData, getAdverseEventsData } from './types';
import ChartSection from './ChartSection';

interface AdverseEventsSectionProps {
  drug: DrugAnalysis;
  chartData: ChartData;
  onViewDetails: () => void;
}

const AdverseEventsSection: React.FC<AdverseEventsSectionProps> = ({ 
  drug, 
  chartData,
  onViewDetails
}) => {
  const adverseEventsData = getAdverseEventsData(drug);
  
  if (!adverseEventsData) return null;

  if (adverseEventsData.total_cases === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <Info className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-green-800">
            {adverseEventsData.message || 'No adverse events reported for this drug.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Adverse Events Overview
        </h3>
        <button
          onClick={onViewDetails}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>View Detailed Analysis</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Preview of top reactions */}
      {chartData.reactionData.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Top Reported Reactions:</h4>
          <div className="space-y-2">
            {chartData.reactionData.slice(0, 3).map((item) => (
              <div key={item.fullName || item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{item.fullName || item.name}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  {item.count} case{item.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
            {chartData.reactionData.length > 3 && (
              <div className="text-center text-sm text-blue-600 mt-2">
                <button onClick={onViewDetails} className="hover:underline">
                  + 12 more reactions
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdverseEventsSection;