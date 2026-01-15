import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import LocationDisplay from './LocationDisplay';

export default function IncidentConfirmation({ incident, onClose, onViewReports }) {
  const resourcesAssigned = incident.assignedResources?.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <CardTitle className="text-2xl text-slate-100">Emergency Reported</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-slate-100 mb-2">{incident.category}</h3>
            <p className="text-sm text-slate-300 mb-3">{incident.type}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${
                incident.severity === 'Critical' ? 'text-red-500' :
                incident.severity === 'High' ? 'text-orange-500' :
                incident.severity === 'Medium' ? 'text-yellow-500' :
                'text-blue-500'
              }`} />
              <span className="text-sm text-slate-300">Severity: {incident.severity}</span>
            </div>
            
            <LocationDisplay 
              lat={incident.location?.lat} 
              lng={incident.location?.lng}
              className="text-slate-400"
            />
          </div>

          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
            <p className="text-green-300 text-sm font-medium mb-2">
              {resourcesAssigned
                ? '✓ Resources have been automatically dispatched'
                : '✓ Your emergency has been reported'}
            </p>
            <p className="text-slate-400 text-xs">
              {resourcesAssigned
                ? 'Nearby agencies and volunteers are being alerted. Response teams are on their way.'
                : 'Response teams and nearby volunteers are being notified. Help is on the way.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700 flex gap-3">
            <Button
              onClick={() => {
                if (onViewReports) {
                  onViewReports();
                } else {
                  onClose();
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              View My Reports
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              Report Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}