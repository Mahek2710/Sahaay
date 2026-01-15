import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LogOut } from 'lucide-react';
import MapboxMap from './MapboxMap';
import { usersAPI } from '@/services/api';
import { clearRole } from '@/utils/auth';
import { useToast } from '@/hooks/useToast';
import { reverseGeocode } from '@/utils/geocoding';

export default function VolunteerProfile({ onComplete, volunteerId, onCancel }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationName, setLocationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    // Auto-detect location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ lat, lng });
          reverseGeocode(lat, lng).then(setLocationName);
        },
        () => console.warn('Location permission denied')
      );
    }
  }, []);

  const handleLocationSelect = async (lat, lng) => {
    setLocation({ lat, lng });
    const name = await reverseGeocode(lat, lng);
    setLocationName(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !phone || !location.lat || !location.lng) {
      error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const volunteerData = {
        name,
        phone,
        role: 'VOLUNTEER',
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        volunteer: {
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          isAvailable: true,
        },
      };

      let savedVolunteer;
      if (volunteerId) {
        // Update existing volunteer (if API supports it)
        const res = await usersAPI.update(volunteerId, volunteerData);
        savedVolunteer = res.data;
      } else {
        // Create new volunteer
        const res = await usersAPI.create(volunteerData);
        savedVolunteer = res.data;
        // Store volunteer ID for future reference
        if (savedVolunteer._id) {
          localStorage.setItem('volunteerId', savedVolunteer._id);
        }
      }

      success('Profile saved successfully!');
      if (onComplete) {
        onComplete(savedVolunteer);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      clearRole();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center p-6">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-100">Volunteer Profile</CardTitle>
              <p className="text-sm text-slate-400 mt-2">
                Complete your profile to start helping with emergencies
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-slate-600 text-slate-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100"
                placeholder="+1234567890"
                required
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Skills (comma-separated)</label>
              <Textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="First Aid, Fire Safety, Search & Rescue"
                className="bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Your Location *</label>
              <div className="h-[300px] border border-slate-700 rounded overflow-hidden mb-2">
                <MapboxMap
                  interactive
                  initialLocation={location.lat ? location : null}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
              {locationName && (
                <p className="text-xs text-slate-400">{locationName}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Profile & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}