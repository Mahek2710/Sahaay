import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AlertCircle, MapPin, Users, Activity, TrendingUp, LogOut } from 'lucide-react';

import MapboxMap from './MapboxMap';
import Analytics from './Analytics';
import LocationDisplay from './LocationDisplay';
import { ToastContainer } from './Toast';
import { useToast } from '@/hooks/useToast';

import { incidentsAPI, resourcesAPI, usersAPI } from '@/services/api';
import { createSocket } from '@/services/socket';
import { clearRole } from '@/utils/auth';

/* ---------------- Incident Card Component ---------------- */
function IncidentCard({ incident, onClick, onAssignVolunteer, availableVolunteers }) {
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

  const resourcesCount = incident.assignedResources?.length || 0;
  const volunteersCount = incident.assignedVolunteers?.length || 0;

  return (
    <Card
      className="bg-slate-800 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
      onClick={() => onClick(incident)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-100">{incident.category}</h3>
                <Badge className={`${severityColors[incident.severity]} text-white`}>
                  {incident.severity}
                </Badge>
                <Badge className={`${statusColors[incident.status]} text-white`}>
                  {incident.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-400">{incident.type}</p>
            </div>
          </div>

          {/* Resources & Volunteers */}
          <div className="flex items-center gap-4 text-sm">
            {resourcesCount > 0 && (
              <div className="flex items-center gap-1 text-green-400">
                <Activity className="h-4 w-4" />
                <span>{resourcesCount} Resource{resourcesCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {volunteersCount > 0 && (
              <div className="flex items-center gap-1 text-blue-400">
                <Users className="h-4 w-4" />
                <span>{volunteersCount} Volunteer{volunteersCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {resourcesCount === 0 && incident.status === 'Responding' && (
              <span className="text-xs text-yellow-400">⚠️ Auto-assignment pending</span>
            )}
          </div>

          {/* Auto-assignment indicator */}
          {resourcesCount > 0 && incident.status === 'Responding' && (
            <div className="text-xs text-green-400 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Resources auto-dispatched</span>
            </div>
          )}

          {/* Location */}
          {incident.location && (
            <LocationDisplay 
              lat={incident.location.lat} 
              lng={incident.location.lng}
              className="text-slate-500"
            />
          )}

          {/* Assign Volunteer Button */}
          {availableVolunteers && availableVolunteers.length > 0 && incident.status !== 'Resolved' && (
            <div className="pt-2 border-t border-slate-700">
              <Select
                value=""
                onValueChange={(volunteerId) => {
                  onAssignVolunteer(incident._id, volunteerId);
                }}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Assign Volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {availableVolunteers.map((vol) => (
                    <SelectItem key={vol._id} value={vol._id}>
                      {vol.name || `Volunteer ${vol.phone}`}
                      {vol.volunteer?.skills?.length > 0 && (
                        <span className="text-xs text-slate-400 ml-2">
                          ({vol.volunteer.skills.join(', ')})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Resource & Volunteer Panel ---------------- */
function ResourceVolunteerPanel({ resources, volunteers }) {
  const availableResources = resources.filter((r) => r.status === 'Available');
  const deployedResources = resources.filter((r) => r.status === 'Deployed');
  const availableVolunteers = volunteers.filter(
    (v) => v.role === 'VOLUNTEER' && v.volunteer?.isAvailable
  );
  const assignedVolunteers = volunteers.filter(
    (v) => v.role === 'VOLUNTEER' && !v.volunteer?.isAvailable
  );

  return (
    <div className="space-y-6">
      {/* Resources Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{availableResources.length}</div>
              <div className="text-sm text-slate-400">Available</div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">{deployedResources.length}</div>
              <div className="text-sm text-slate-400">Deployed</div>
            </div>
          </div>

          {/* Resource List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {resources.slice(0, 5).map((r) => (
              <div
                key={r._id}
                className={`p-2 rounded text-sm ${
                  r.status === 'Available'
                    ? 'bg-green-900/20 text-green-300'
                    : r.status === 'Deployed'
                    ? 'bg-yellow-900/20 text-yellow-300'
                    : 'bg-red-900/20 text-red-300'
                }`}
              >
                <div className="font-medium">{r.capability}</div>
                <div className="text-xs opacity-75">{r.domain} • {r.status}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Volunteers Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Volunteers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{availableVolunteers.length}</div>
              <div className="text-sm text-slate-400">Available</div>
            </div>
            <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-400">{assignedVolunteers.length}</div>
              <div className="text-sm text-slate-400">Assigned</div>
            </div>
          </div>

          {/* Available Volunteers List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="text-xs text-slate-400 mb-2">Available Volunteers:</div>
            {availableVolunteers.slice(0, 5).map((v) => (
              <div
                key={v._id}
                className="bg-green-900/20 border border-green-700/50 rounded p-2 text-sm text-green-300"
              >
                <div className="font-medium">{v.name || `Volunteer ${v.phone}`}</div>
                {v.volunteer?.skills?.length > 0 && (
                  <div className="text-xs opacity-75">{v.volunteer.skills.join(', ')}</div>
                )}
              </div>
            ))}
            {availableVolunteers.length === 0 && (
              <div className="text-sm text-slate-500">No available volunteers</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResponseDesk({ onRoleChange }) {
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toasts, removeToast, success, error, info } = useToast();

  const handleLogout = () => {
    clearRole();
    if (onRoleChange) {
      onRoleChange();
    }
  };

  /* ---------------- Fetch Data + Socket Setup ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, resRes, volRes] = await Promise.all([
          incidentsAPI.getAll(),
          resourcesAPI.getAll(),
          usersAPI.getByRole('VOLUNTEER').catch(() => ({ data: [] })), // Fallback if endpoint fails
        ]);
        setIncidents(incRes.data);
        setResources(resRes.data);
        setVolunteers(volRes.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        // Mock volunteers if API fails (for demo)
        setVolunteers([
          {
            _id: 'mock1',
            name: 'John Doe',
            phone: '1234567890',
            role: 'VOLUNTEER',
            volunteer: { isAvailable: true, skills: ['First Aid', 'Search'] },
          },
          {
            _id: 'mock2',
            name: 'Jane Smith',
            phone: '9876543210',
            role: 'VOLUNTEER',
            volunteer: { isAvailable: true, skills: ['Fire Safety'] },
          },
        ]);
      }
    };

    fetchData();

    /* ---------------- Socket.io Real-time Updates ---------------- */
    const socket = createSocket();

    socket.on('incidentCreated', (incident) => {
      setIncidents((prev) => [incident, ...prev]);
      info(`New incident reported: ${incident.category}`, 4000);
    });

    // Listen for incident updates (if backend emits them in future)
    socket.on('incidentUpdated', (incident) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === incident._id ? incident : i))
      );
      info(`Incident updated: ${incident.category}`, 3000);
    });

    socket.on('resourceUpdated', (resource) => {
      setResources((prev) => {
        const exists = prev.find((r) => r._id === resource._id);
        const updated = exists
          ? prev.map((r) => (r._id === resource._id ? resource : r))
          : [...prev, resource];
        
        if (!exists || exists.status !== resource.status) {
          if (resource.status === 'Deployed') {
            info(`Resource deployed: ${resource.capability}`, 3000);
          }
        }
        
        return updated;
      });
    });

    // Refresh volunteers periodically (since we can't listen for volunteer updates via socket)
    const volunteerInterval = setInterval(() => {
      usersAPI.getByRole('VOLUNTEER')
        .then((res) => setVolunteers(res.data || []))
        .catch(() => {}); // Silently fail, keep existing volunteers
    }, 10000);

    return () => {
      socket.disconnect();
      clearInterval(volunteerInterval);
    };
  }, []);

  /* ---------------- Handle Incident Click ---------------- */
  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    setIsDialogOpen(true);
  };

  /* ---------------- Assign Volunteer ---------------- */
  const handleAssignVolunteer = async (incidentId, volunteerId) => {
    try {
      const res = await incidentsAPI.assignVolunteer(incidentId, volunteerId);
      const updatedIncident = res.data;

      setIncidents((prev) =>
        prev.map((i) => (i._id === incidentId ? updatedIncident : i))
      );

      // Update selected incident if it's the one being updated
      if (selectedIncident && selectedIncident._id === incidentId) {
        setSelectedIncident(updatedIncident);
      }

      // Update volunteers list
      setVolunteers((prev) =>
        prev.map((v) =>
          v._id === volunteerId
            ? { ...v, volunteer: { ...v.volunteer, isAvailable: false } }
            : v
        )
      );

      const volunteer = volunteers.find((v) => v._id === volunteerId);
      success(`Volunteer ${volunteer?.name || volunteer?.phone || 'assigned'} assigned to incident`, 3000);
    } catch (err) {
      console.error('Error assigning volunteer:', err);
      error(err.response?.data?.error || 'Failed to assign volunteer', 4000);
    }
  };

  /* ---------------- Stats ---------------- */
  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved');
  const criticalIncidents = incidents.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved');
  const availableVolunteers = volunteers.filter(
    (v) => v.role === 'VOLUNTEER' && v.volunteer?.isAvailable
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Coordinator Dashboard</h1>
              <p className="text-sm text-slate-400">Manage incidents and assign resources</p>
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

      <Tabs defaultValue="dashboard" className="w-full">
        <div className="border-b border-slate-700 p-4 bg-slate-900">
          <TabsList>
            <TabsTrigger value="dashboard">Response Desk</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </div>

        {/* ---------------- MAIN DASHBOARD TAB ---------------- */}
        <TabsContent value="dashboard" className="mt-0">
          <div className="container mx-auto px-4 py-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Total Incidents</div>
                      <div className="text-2xl font-bold text-slate-100">{incidents.length}</div>
                    </div>
                    <AlertCircle className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Active</div>
                      <div className="text-2xl font-bold text-slate-100">{activeIncidents.length}</div>
                    </div>
                    <Activity className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Critical</div>
                      <div className="text-2xl font-bold text-red-400">{criticalIncidents.length}</div>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Available Volunteers</div>
                      <div className="text-2xl font-bold text-green-400">{availableVolunteers.length}</div>
                    </div>
                    <Users className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Incident List */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Live Incidents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                      {incidents.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          No incidents reported yet
                        </div>
                      ) : (
                        incidents.map((incident) => (
                          <IncidentCard
                            key={incident._id}
                            incident={incident}
                            onClick={handleIncidentClick}
                            onAssignVolunteer={handleAssignVolunteer}
                            availableVolunteers={availableVolunteers}
                          />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Resources & Volunteers Panel */}
              <div className="lg:col-span-1">
                <ResourceVolunteerPanel resources={resources} volunteers={volunteers} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- MAP VIEW TAB ---------------- */}
        <TabsContent value="map" className="mt-0">
          <div className="h-[calc(100vh-150px)] w-full">
            <MapboxMap
              incidents={incidents}
              resources={resources}
              onIncidentClick={handleIncidentClick}
            />
          </div>
        </TabsContent>

        {/* ---------------- ANALYTICS TAB ---------------- */}
        <TabsContent value="analytics" className="mt-0">
          <div className="container mx-auto px-4 py-6">
            <Analytics />
          </div>
        </TabsContent>
      </Tabs>

      {/* ---------------- INCIDENT DETAIL DIALOG ---------------- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedIncident.category}</DialogTitle>
                <DialogDescription>{selectedIncident.type}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Status & Severity */}
                <div className="flex items-center gap-4">
                  <Badge className="bg-blue-500 text-white">{selectedIncident.status}</Badge>
                  <Badge className="bg-red-600 text-white">{selectedIncident.severity}</Badge>
                </div>

                {/* Assigned Resources */}
                {selectedIncident.assignedResources && selectedIncident.assignedResources.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-400">Assigned Resources:</h4>
                    <div className="space-y-2">
                      {selectedIncident.assignedResources.map((resource) => (
                        <div
                          key={resource._id || resource}
                          className="bg-slate-700 p-2 rounded text-sm"
                        >
                          {typeof resource === 'object' ? (
                            <>
                              <div className="font-medium">{resource.capability}</div>
                              <div className="text-xs text-slate-400">{resource.domain}</div>
                            </>
                          ) : (
                            <span>Resource ID: {resource}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Volunteers */}
                {selectedIncident.assignedVolunteers &&
                  selectedIncident.assignedVolunteers.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-blue-400">Assigned Volunteers:</h4>
                      <div className="space-y-2">
                        {selectedIncident.assignedVolunteers.map((volunteer) => (
                          <div
                            key={volunteer._id || volunteer}
                            className="bg-slate-700 p-2 rounded text-sm"
                          >
                            {typeof volunteer === 'object' ? (
                              <>
                                <div className="font-medium">
                                  {volunteer.name || `Volunteer ${volunteer.phone}`}
                                </div>
                                {volunteer.volunteer?.skills?.length > 0 && (
                                  <div className="text-xs text-slate-400">
                                    {volunteer.volunteer.skills.join(', ')}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span>Volunteer ID: {volunteer}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Notes */}
                {selectedIncident.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes:</h4>
                    <p className="text-sm text-slate-300">{selectedIncident.notes}</p>
                  </div>
                )}

                {/* Location */}
                {selectedIncident.location && (
                  <div>
                    <h4 className="font-semibold mb-2">Location:</h4>
                    <LocationDisplay 
                      lat={selectedIncident.location.lat} 
                      lng={selectedIncident.location.lng}
                      className="text-slate-300"
                    />
                  </div>
                )}

                {/* Created At */}
                {selectedIncident.createdAt && (
                  <div className="text-xs text-slate-500">
                    Reported: {new Date(selectedIncident.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}