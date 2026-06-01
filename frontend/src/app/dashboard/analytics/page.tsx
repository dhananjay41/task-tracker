'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { BarChart3, Clock, AlertTriangle, Users, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics');
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin"></div>
            <span className="text-slate-600 font-medium tracking-widest uppercase text-xs">Computing Metrics...</span>
        </div>
    );
  }

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-1000">
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Performance Insights</h1>
        <p className="text-slate-500 mt-2 text-lg">Real-time aggregation of team productivity and overdue risks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overdue Tasks Section */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
              <AlertTriangle className="text-rose-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Overdue Tasks</h2>
              <p className="text-slate-500 text-sm">Critical tasks requiring immediate attention.</p>
            </div>
          </div>

          <div className="space-y-4">
            {data?.overdueTasks?.map((item: any) => (
              <div key={item.email} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <span className="text-xs text-white uppercase">{item.email.charAt(0)}</span>
                    </div>
                    <span className="text-slate-300 font-medium">{item.email}</span>
                </div>
                <span className="bg-rose-500/20 text-rose-500 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/30">
                  {item.overdueCount} Overdue
                </span>
              </div>
            ))}
            {(!data?.overdueTasks || data.overdueTasks.length === 0) && (
                <div className="text-center py-8">
                    <p className="text-slate-600 italic">No overdue tasks. Dynamic team!</p>
                </div>
            )}
          </div>
        </div>

        {/* Avg Completion Time Section */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Clock className="text-emerald-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Efficiency Metrics</h2>
              <p className="text-slate-500 text-sm">Average hours taken from creation to completion.</p>
            </div>
          </div>

          <div className="space-y-4">
            {data?.avgCompletionTimes?.map((item: any) => (
              <div key={item.email} className="group flex flex-col gap-3 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/40 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <span className="text-xs text-white uppercase">{item.email.charAt(0)}</span>
                        </div>
                        <span className="text-slate-300 font-medium">{item.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                        <TrendingUp size={14} />
                        <span className="text-sm">{item.avgCompletionTimeHours.toFixed(1)}h</span>
                    </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-emerald-500 h-full transition-all duration-1000" 
                        style={{ width: `${Math.min(item.avgCompletionTimeHours * 10, 100)}%` }}
                    />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
