import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Activity, LogOut } from 'lucide-react';
import MapboxMap from './MapboxMap';
import LocationDisplay from './LocationDisplay';
import { incidentsAPI, resourcesAPI } from '@/services/api';
import { createSocket } from '@/services/socket';
import { clearRole } from '@/utils/auth';
import { ToastContainer } from './Toast';
import { useToast } from '@/hooks/useToast';

export default function AgencyDashboard({ onRoleChange }) {
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, resRes] = await Promise.all([
          incidentsAPI.getAll(),
          resourcesAPI.getAll(),
        ]);
        setIncidents(incRes.data);
        setResources(resRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();

    const socket = createSocket();
    socket.on('incidentCreated', (incident) => {
      setIncidents((prev) => [incident, ...prev]);
    });

    socket.on('incidentUpdated', (incident) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === incident._id ? incident : i))
      );
    });

    socket.on('resourceUpdated', (resource) => {
      setResources((prev) => {
        const exists = prev.find((r) => r._id === resource._id);
        return exists
          ? prev.map((r) => (r._id === resource._id ? resource : r))
          : [...prev, resource];
      });
    });

    return () => socket.disconnect();
  }, []);

  const handleResourceStatusChange = async (resourceId, newStatus) => {
    try {
      await resourcesAPI.update(resourceId, { status: newStatus });
      success(`Resource status updated to ${newStatus}`, 3000);
    } catch (err) {
      console.error('Error updating resource:', err);
      error('Failed to update resource status', 4000);
    }
  };

  const handleLogout = () => {
    clearRole();
    if (onRoleChange) {
      onRoleChange();
    }
  };

  // Filter incidents by domain (simplified - in real app would match agency domain)
  const filteredIncidents = selectedDomain === 'all'
    ? incidents
    : incidents.filter((incident) => {
        // Match incidents that have resources from selected domain
        const hasDomainResource = incident.assignedResources?.some((r) => {
          const resource = typeof r === 'object' ? r : resources.find((res) => res._id === r);
          return resource?.domain === selectedDomain;
        });
        return hasDomainResource;
      });

  const domains = ['all', ...new Set(resources.map((r) => r.domain))];

  const severityColors = {
    Low: 'bg-blue-500',
    Medium: 'bg-yellow-500',
    High: 'bg-orange-500',
    Critical: 'bg-red-600',
  };

  const statusColors = {
    Available: 'bg-green-600',
    Deployed: 'bg-yellow-600',
    Unavailable: 'bg-red-600',
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Agency Dashboard</h1>
              <p className="text-sm text-slate-400">Manage resources and view domain incidents</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Switch Role
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="incidents" className="w-full">
        <div className="border-b border-slate-700 p-4">
          <TabsList>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="incidents" className="mt-0">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-4">
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-64 bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Filter by domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain === 'all' ? 'All Domains' : domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Incidents ({filteredIncidents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredIncidents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">No incidents found</div>
                  ) : (
                    filteredIncidents.map((incident) => (
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
                              <Badge className="bg-blue-500 text-white">{incident.status}</Badge>
                            </div>
                          </div>

                          {incident.assignedResources && incident.assignedResources.length > 0 && (
                            <div className="mt-2 text-sm text-slate-300">
                              <span className="font-medium">Resources:</span>{' '}
                              {incident.assignedResources.map((r, idx) => {
                                const resource = typeof r === 'object' ? r : resources.find((res) => res._id === r);
                                return resource ? (
                                  <span key={idx} className="text-green-400">
                                    {resource.capability}
                                    {idx < incident.assignedResources.length - 1 ? ', ' : ''}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}

                          {incident.location && (
                            <LocationDisplay 
                              lat={incident.location.lat} 
                              lng={incident.location.lng}
                              className="mt-2 text-slate-500"
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-0">
          <div className="container mx-auto px-4 py-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Agency Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resources.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">No resources available</div>
                  ) : (
                    resources.map((resource) => (
                      <Card key={resource._id} className="bg-slate-700 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-100 mb-1">
                                {resource.capability}
                              </h3>
                              <p className="text-sm text-slate-400 mb-2">{resource.domain}</p>
                              <Badge className={`${statusColors[resource.status]} text-white`}>
                                {resource.status}
                              </Badge>
                            </div>
                            <Select
                              value={resource.status}
                              onValueChange={(value) =>
                                handleResourceStatusChange(resource._id, value)
                              }
                            >
                              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Deployed">Deployed</SelectItem>
                                <SelectItem value="Unavailable">Unavailable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          <div className="h-[calc(100vh-200px)] w-full">
            <MapboxMap incidents={filteredIncidents} resources={resources} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}