import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapboxMap from './MapboxMap';
import IncidentConfirmation from './IncidentConfirmation';
import LocationDisplay from './LocationDisplay';
import MyReports from './MyReports';
import { ToastContainer } from './Toast';
import { useToast } from '@/hooks/useToast';
import { incidentsAPI } from '@/services/api';
import { INCIDENT_CATEGORIES, SEVERITY_LEVELS } from '@/data/incidentCategories';

export default function CitizenPortal() {
  const [category, setCategory] = useState('');
  const [detail, setDetail] = useState('');
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [showMyReports, setShowMyReports] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  const isOtherCategory = category === 'Other / Unknown';
  const subTypes = category ? (INCIDENT_CATEGORIES[category] || []) : [];

  /* ---------------- AUTO DETECT USER LOCATION ---------------- */
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      setLocationLoaded(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocationLoaded(true);
      },
      (err) => {
        console.warn('Location permission denied', err);
        setLocationLoaded(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleLocationSelect = (lat, lng) => {
    setLocation({ lat, lng });
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category || !severity || !location.lat || !location.lng) {
      alert('Please fill all required fields.');
      return;
    }

    if (!isOtherCategory && !detail) {
      alert('Please select an incident type.');
      return;
    }

    if (isOtherCategory && !detail.trim()) {
      alert('Please describe the incident.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await incidentsAPI.create({
        category,
        type: detail,
        severity,
        notes: notes.trim() || undefined,
        location: {
          lat: location.lat,
          lng: location.lng
        }
      });

      const incident = response.data;
      
      // Show confirmation screen
      setSubmittedIncident(incident);
      
      // Reset form
      setCategory('');
      setDetail('');
      setSeverity('');
      setNotes('');
      setLocation({ lat: null, lng: null });
    } catch (err) {
      console.error('Error reporting incident:', err);
      error('Failed to report emergency. Please try again.', 5000);
      setIsSubmitting(false);
    }
  };

  // Show My Reports if requested
  if (showMyReports) {
    return <MyReports onBack={() => setShowMyReports(false)} />;
  }

  // Show confirmation screen if incident was submitted
  if (submittedIncident) {
    return (
      <IncidentConfirmation 
        incident={submittedIncident}
        onClose={() => setSubmittedIncident(null)}
        onViewReports={() => {
          setSubmittedIncident(null);
          setShowMyReports(true);
        }}
      />
    );
  }

  return (
    <div className="bg-slate-900 text-slate-100 flex justify-center p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="w-full max-w-xl">
        <Card className="bg-slate-800 border border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl">Report Emergency</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* CATEGORY */}
              <div>
                <label className="text-sm">Incident Category</label>
                <Select value={category} onValueChange={(v) => {
                  setCategory(v);
                  setDetail('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(INCIDENT_CATEGORIES).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TYPE */}
              {category && (
                <div>
                  <label className="text-sm">
                    {isOtherCategory ? 'Incident Detail *' : 'Incident Type *'}
                  </label>

                  {isOtherCategory ? (
                    <Textarea
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      placeholder="Describe the incident"
                    />
                  ) : (
                    <Select value={detail} onValueChange={setDetail}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {subTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* SEVERITY */}
              <div>
                <label className="text-sm">Severity Level</label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* LOCATION */}
              <div>
                <label className="text-sm">Location *</label>
                <div className="h-[320px] border border-slate-700 rounded overflow-hidden">
                  <MapboxMap
                    interactive
                    initialLocation={
                      location.lat ? location : null
                    }
                    onLocationSelect={handleLocationSelect}
                  />
                </div>

                {location.lat && (
                  <LocationDisplay 
                    lat={location.lat} 
                    lng={location.lng}
                    className="mt-1 text-slate-400"
                  />
                )}

                {!locationLoaded && (
                  <p className="text-xs text-slate-500 mt-1">
                    Detecting your location…
                  </p>
                )}
              </div>

              {/* NOTES */}
              <div>
                <label className="text-sm">Additional Notes (Optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* SUBMIT */}
              <Button
                type="submit"
                className="w-full py-6 text-lg bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Reporting...' : 'Report Emergency'}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
