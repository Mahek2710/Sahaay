import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { incidentsAPI, resourcesAPI } from '@/services/api';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    criticalIncidents: 0,
    avgResponseTime: 0,
    resourceUtilization: 0,
    resolvedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [incidentsRes, resourcesRes] = await Promise.all([
          incidentsAPI.getAll(),
          resourcesAPI.getAll(),
        ]);
        const incidents = incidentsRes.data;
        const resources = resourcesRes.data;

        const resolved = incidents.filter((i) => i.status === 'Resolved');
        const critical = incidents.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved');
        const totalResources = resources.length || 1; // Avoid division by zero
        const deployedResources = resources.filter((r) => r.status === 'Deployed').length;

        // Calculate average response time (in minutes)
        let totalResponseTime = 0;
        let countWithTime = 0;
        resolved.forEach((incident) => {
          if (incident.resolvedAt && incident.createdAt) {
            const timeDiff = new Date(incident.resolvedAt) - new Date(incident.createdAt);
            totalResponseTime += timeDiff / (1000 * 60); // Convert to minutes
            countWithTime++;
          }
        });
        const avgResponseTime = countWithTime > 0 ? totalResponseTime / countWithTime : 0;

        setStats({
          totalIncidents: incidents.length || 0,
          criticalIncidents: critical.length || 0,
          avgResponseTime: Math.round(avgResponseTime) || 0,
          resourceUtilization: Math.round((deployedResources / totalResources) * 100) || 0,
          resolvedCount: resolved.length || 0,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
        // Stats remain at default values (0)
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading analytics...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Total Incidents</div>
                <div className="text-2xl font-bold text-slate-100">{stats.totalIncidents}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Critical</div>
                <div className="text-2xl font-bold text-red-400">{stats.criticalIncidents}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Avg Response Time</div>
                <div className="text-2xl font-bold text-slate-100">{stats.avgResponseTime} min</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Resource Utilization</div>
                <div className="text-2xl font-bold text-slate-100">{stats.resourceUtilization}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
