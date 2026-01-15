import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, LogOut, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import { incidentsAPI, usersAPI } from '@/services/api';
import { createSocket } from '@/services/socket';
import { clearRole, getRole } from '@/utils/auth';
import { ToastContainer } from './Toast';
import { useToast } from '@/hooks/useToast';
import VolunteerProfile from './VolunteerProfile';
import LocationDisplay from './LocationDisplay';
import { getDistanceKm } from '@/utils/distance';

export default function VolunteerDashboard({ onRoleChange }) {
  const [incidents, setIncidents] = useState([]);
  const [volunteer, setVolunteer] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, usersRes] = await Promise.all([
          incidentsAPI.getAll(),
          usersAPI.getAll().catch(() => ({ data: [] })),
        ]);
        
        // Get current volunteer - check localStorage for volunteer ID
        const volunteerId = localStorage.getItem('volunteerId');
        let currentVol = null;
        
        if (volunteerId) {
          const volunteers = usersRes.data?.filter((u) => u.role === 'VOLUNTEER') || [];
          currentVol = volunteers.find((v) => v._id === volunteerId);
        }
        
        // If no volunteer profile exists, show profile form
        if (!currentVol) {
          setShowProfile(true);
          return;
        }
        
        setVolunteer(currentVol);
        setIsAvailable(currentVol.volunteer?.isAvailable ?? true);
        
        // Filter incidents: only show nearby incidents (within 50km)
        const allIncidents = incRes.data.filter((i) => i.status !== 'Resolved');
        
        if (currentVol.location?.lat && currentVol.location?.lng) {
          const nearbyIncidents = allIncidents
            .map((incident) => {
              if (!incident.location?.lat || !incident.location?.lng) return null;
              const distance = getDistanceKm(
                currentVol.location.lat,
                currentVol.location.lng,
                incident.location.lat,
                incident.location.lng
              );
              return { ...incident, distance };
            })
            .filter((inc) => inc && inc.distance <= 50) // Within 50km
            .sort((a, b) => a.distance - b.distance); // Sort by distance
          
          setIncidents(nearbyIncidents);
        } else {
          setIncidents(allIncidents);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();

    const socket = createSocket();
    socket.on('incidentCreated', (incident) => {
      if (incident.status !== 'Resolved') {
        setIncidents((prev) => [incident, ...prev]);
      }
    });

    socket.on('incidentUpdated', (incident) => {
      setIncidents((prev) => {
        if (incident.status === 'Resolved') {
          return prev.filter((i) => i._id !== incident._id);
        }
        return prev.map((i) => (i._id === incident._id ? incident : i));
      });
    });

    return () => socket.disconnect();
  }, []);

  const handleToggleAvailability = async () => {
    // Note: Backend endpoint requires COORDINATOR/AGENCY permissions
    // For demo, we'll update local state. In production, would need self-update endpoint
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);
    
    if (volunteer?._id) {
      try {
        await usersAPI.updateVolunteerAvailability(volunteer._id, newAvailability);
        setVolunteer({ ...volunteer, volunteer: { ...volunteer.volunteer, isAvailable: newAvailability } });
      } catch (err) {
        // If API fails (permission denied), just update local state for demo
        console.warn('API update failed, using local state:', err);
      }
    }
    
    success(
      newAvailability ? 'You are now available to help' : 'You are now unavailable',
      3000
    );
  };

  const handleOptToHelp = async (incidentId) => {
    if (!volunteer?._id) {
      error('Volunteer ID not found. Please refresh.', 4000);
      return;
    }

    try {
      await incidentsAPI.assignVolunteer(incidentId, volunteer._id);
      setIsAvailable(false);
      success('You have been assigned to this incident!', 4000);
      
      // Refresh incidents
      const res = await incidentsAPI.getAll();
      setIncidents(res.data.filter((i) => i.status !== 'Resolved'));
    } catch (err) {
      console.error('Error opting to help:', err);
      error(err.response?.data?.error || 'Failed to opt in. Please try again.', 4000);
    }
  };

  const handleProfileComplete = async (savedVolunteer) => {
    if (savedVolunteer && savedVolunteer._id) {
      localStorage.setItem('volunteerId', savedVolunteer._id);
      setVolunteer(savedVolunteer);
      setShowProfile(false);
      setIsAvailable(savedVolunteer.volunteer?.isAvailable ?? true);
      
      // Refresh data
      try {
        const [incRes] = await Promise.all([
          incidentsAPI.getAll(),
        ]);
        
        const allIncidents = incRes.data.filter((i) => i.status !== 'Resolved');
        
        if (savedVolunteer.location?.lat && savedVolunteer.location?.lng) {
          const nearbyIncidents = allIncidents
            .map((incident) => {
              if (!incident.location?.lat || !incident.location?.lng) return null;
              const distance = getDistanceKm(
                savedVolunteer.location.lat,
                savedVolunteer.location.lng,
                incident.location.lat,
                incident.location.lng
              );
              return { ...incident, distance };
            })
            .filter((inc) => inc && inc.distance <= 50)
            .sort((a, b) => a.distance - b.distance);
          
          setIncidents(nearbyIncidents);
        } else {
          setIncidents(allIncidents);
        }
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    }
  };

  const handleLogout = () => {
    clearRole();
    localStorage.removeItem('volunteerId');
    if (onRoleChange) {
      onRoleChange();
    }
  };

  // Show profile form if volunteer hasn't completed it
  if (showProfile) {
    return (
      <VolunteerProfile 
        onComplete={handleProfileComplete}
        onCancel={() => {
          clearRole();
          if (onRoleChange) {
            onRoleChange();
          }
        }}
      />
    );
  }

  const severityColors = {
    Low: 'bg-blue-500',
    Medium: 'bg-yellow-500',
    High: 'bg-orange-500',
    Critical: 'bg-red-600',
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Volunteer Dashboard</h1>
              <p className="text-sm text-slate-400">Help respond to emergencies</p>
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

      <div className="container mx-auto px-4 py-6">
        {/* Availability Toggle */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isAvailable ? (
                  <ToggleRight className="h-8 w-8 text-green-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Availability Status</h3>
                  <p className="text-sm text-slate-400">
                    {isAvailable ? 'You are available to help' : 'You are currently unavailable'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleToggleAvailability}
                className={isAvailable ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}
              >
                {isAvailable ? 'Set Unavailable' : 'Set Available'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Incidents */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No active incidents at the moment
                </div>
              ) : (
                incidents.map((incident) => {
                  const isAssigned = incident.assignedVolunteers?.some(
                    (v) => v._id === volunteer?._id || v === volunteer?._id
                  );

                  return (
                    <Card key={incident._id} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-100 mb-1">
                              {incident.category}
                            </h3>
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
                          <div className="text-xs text-green-400 mb-2">
                            ✓ {incident.assignedResources.length} Resource(s) assigned
                          </div>
                        )}

                        {isAssigned ? (
                          <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded text-sm text-blue-300">
                            ✓ You are assigned to this incident
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleOptToHelp(incident._id)}
                            disabled={!isAvailable}
                            className="mt-3 w-full bg-green-600 hover:bg-green-700"
                          >
                            Opt to Help
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}