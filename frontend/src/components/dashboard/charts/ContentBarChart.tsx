'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ContentStats } from '@/types/dashboard';

interface ContentBarChartProps {
  stats: ContentStats | null;
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border/20 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: payload[0].color }} />
          Count: <span className="font-semibold text-foreground">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ContentBarChart({ stats, isLoading }: ContentBarChartProps) {
  if (isLoading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Images',
      value: stats.images || 0,
      color: '#10b981', // emerald-500
    },
    {
      name: 'Voiceovers', 
      value: stats.voiceovers || 0,
      color: '#8b5cf6', // purple-500
    },
    {
      name: 'Music',
      value: stats.musicTracks || 0,
      color: '#ec4899', // pink-500
    },
    {
      name: 'Animations',
      value: stats.animations || 0,
      color: '#f97316', // orange-500
    },
    {
      name: 'Videos',
      value: stats.videos || 0,
      color: '#0ea5e9', // sky-500
    },
  ];

  // Filter out zero values for cleaner chart
  const filteredData = chartData.filter(item => item.value > 0);
  
  // If no data, show empty state
  if (filteredData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No content created yet</p>
          <p className="text-sm">Start creating to see your statistics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={filteredData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 25,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.3}
          />
          <XAxis 
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={50}
            interval={0}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}