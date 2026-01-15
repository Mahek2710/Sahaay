import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { incidentsAPI } from '@/services/api';
import { createSocket } from '@/services/socket';
import LocationDisplay from './LocationDisplay';

export default function MyReports({ onBack }) {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await incidentsAPI.getAll();
        // Show all incidents (since backend doesn't track reporter)
        // In production, would filter by user ID
        setIncidents(res.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 10)); // Show latest 10
      } catch (error) {
        console.error('Error fetching incidents:', error);
      }
    };

    fetchIncidents();

    const socket = createSocket();
    socket.on('incidentCreated', (incident) => {
      setIncidents((prev) => [incident, ...prev].slice(0, 10));
    });

    socket.on('incidentUpdated', (incident) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === incident._id ? incident : i))
      );
    });

    return () => socket.disconnect();
  }, []);

  const severityColors = {
    Low: 'bg-blue-500',
    Medium: 'bg-yellow-500',
    High: 'bg-orange-500',
    Critical: 'bg-red-600',
  };

  const statusColors = {
    Reported: 'bg-gray-500',
    Responding: 'bg-blue-500',
    Resolved: 'bg-green-500',
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Emergency Reports
            </CardTitle>
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="border-slate-600 text-slate-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No incidents reported yet
              </div>
            ) : (
              incidents.map((incident) => (
                <Card key={incident._id} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-100">{incident.category}</h3>
                        <p className="text-sm text-slate-400">{incident.type}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`${severityColors[incident.severity]} text-white`}>
                          {incident.severity}
                        </Badge>
                        <Badge className={`${statusColors[incident.status]} text-white`}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <LocationDisplay 
                      lat={incident.location?.lat} 
                      lng={incident.location?.lng}
                      className="text-slate-400"
                    />
                    
                    {incident.createdAt && (
                      <p className="text-xs text-slate-500 mt-2">
                        Reported: {new Date(incident.createdAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}