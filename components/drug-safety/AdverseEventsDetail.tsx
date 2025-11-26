// components/drug-safety/AdverseEventsDetail.tsx
import React from 'react';
import { BarChart3, AlertTriangle, Users, Globe, Search, Info } from 'lucide-react';
import { DrugAnalysis } from '@/types/drugSafety';
import { ChartData, getAdverseEventsData, getSeverityData } from './types';
import ChartSection from './ChartSection';

interface AdverseEventsDetailProps {
  drug: DrugAnalysis;
  chartData: ChartData;
}

const AdverseEventsDetail: React.FC<AdverseEventsDetailProps> = ({ drug, chartData }) => {
  const adverseEventsData = getAdverseEventsData(drug);
  
  if (!adverseEventsData) return null;
  
  if (adverseEventsData.total_cases === 0) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center">
        <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-1">No Adverse Events Data</h3>
        <p className="text-gray-500">
          No adverse event reports were found for {drug.drug_name} in the FDA database.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 rounded-full">
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-orange-900">
              Adverse Events: {drug.drug_name}
            </h3>
            <p className="text-sm text-orange-800">
              FDA Adverse Event Reporting System (FAERS) Data
            </p>
          </div>
        </div>
      </div>

      {/* Case Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-gray-500 text-sm">Total Adverse Events Reported</h4>
            <div className="group relative">
               <Info className="w-4 h-4 text-gray-500 cursor-help" />
               <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-white text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64 border border-gray-200 shadow-lg">
                 <div className="font-semibold mb-1">Adverse Events:</div>
                 Any unfavorable symptom, sign, abnormal laboratory finding, or disease temporally associated with the use of a drug—even if the drug is not necessarily responsible.
                 <div className="absolute top-full right-4 border-4 border-transparent border-t-white"></div>
               </div>
             </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
          {adverseEventsData?.total_cases_in_database || 0}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <h4 className="font-medium text-gray-500 text-sm mb-1"> Total Serious Cases Reported</h4>
          <p className="text-2xl font-semibold text-gray-900">
            {getSeverityData(drug)?.serious_cases || 0}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <h4 className="font-medium text-gray-500 text-sm mb-1">Hospitalizations</h4>
          <p className="text-2xl font-semibold text-gray-900">
            {getSeverityData(drug)?.hospitalization_cases || 0}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
          <h4 className="font-medium text-gray-500 text-sm mb-1">Deaths</h4>
          <p className="text-2xl font-semibold text-gray-900">
            {getSeverityData(drug)?.death_cases || 0}
          </p>
        </div>
      </div>

      {/* Reaction Chart */}
      {chartData.reactionData.length > 0 && (
        <ChartSection 
          title="Most Common Reported Adverse Reactions" 
          icon={<BarChart3 className="w-5 h-5" />}
          data={chartData.reactionData}
          showFullNames={true}
          fill="#3B82F6"
          height={300}
        />
      )}

      {/* Severity Chart */}
      {chartData.severityData.length > 0 && (
        <ChartSection 
          title="Severity Distribution" 
          icon={<AlertTriangle className="w-5 h-5" />}
          data={chartData.severityData}
          dataKey="value"
          height={300}
        />
      )}

    
      {/* Geographic Distribution */}
      {chartData.countryData.length > 0 && (
        <ChartSection 
          title="Geographic Distribution" 
          icon={<Globe className="w-5 h-5" />}
          data={chartData.countryData}
          fill="#F59E0B"
          height={250}
        />
      )}

      {/* Message */}
      {adverseEventsData.message && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800">{adverseEventsData.message}</p>
        </div>
      )}
    </div>
  );
};

export default AdverseEventsDetail;