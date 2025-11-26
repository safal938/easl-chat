// components/drug-safety/ChartSection.tsx
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell
} from 'recharts';
import { ChartDataItem } from './types';

// Custom tooltip component
export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium">{`${label}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

interface ChartSectionProps {
  title: string;
  icon?: React.ReactNode;
  data: ChartDataItem[];
  dataKey?: string;
  height?: number;
  colorKey?: string;
  showFullNames?: boolean;
  fill?: string;
}

const ChartSection: React.FC<ChartSectionProps> = ({
  title,
  icon,
  data,
  dataKey = 'count',
  height = 300,
  colorKey = 'color',
  showFullNames = false,
  fill = '#3B82F6'
}) => {
  if (data.length === 0) return null;

  // ✅ Sort data by value (descending) and take top 15
  const limitedData = [...data]
    .sort((a, b) => (Number(b[dataKey as keyof ChartDataItem])) - (Number(a[dataKey as keyof ChartDataItem])))
    .slice(0, 15);

  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h4>
      <div className="bg-white p-4 rounded-lg border">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={limitedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {limitedData.map((entry, index) => (
                entry[colorKey as keyof ChartDataItem] ? (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry[colorKey as keyof ChartDataItem] as string}
                  />
                ) : (
                  <Cell key={`cell-${index}`} fill={fill} />
                )
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showFullNames && (
        <div className="mt-4 space-y-2">
          <h5 className="font-medium text-gray-900">Detailed Breakdown:</h5>
          {limitedData.map((item) => (
            <div
              key={item.fullName || item.name}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="text-sm text-gray-700">
                {item.fullName || item.name}
              </span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                {item[dataKey as keyof ChartDataItem]} case
                {item[dataKey as keyof ChartDataItem] !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartSection;
