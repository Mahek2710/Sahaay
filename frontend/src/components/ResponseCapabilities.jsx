import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resourcesAPI } from '@/services/api';

export default function ResponseCapabilities({ resources, setResources }) {
  const statusColors = {
    Available: 'bg-green-600',
    Deployed: 'bg-amber-600',
    Unavailable: 'bg-red-600',
  };

  const handleStatusChange = async (resourceId, newStatus) => {
    try {
      const response = await resourcesAPI.update(resourceId, { status: newStatus });
      setResources((prev) =>
        prev.map((r) => (r._id === resourceId ? response.data : r))
      );
    } catch (error) {
      console.error('Error updating resource status:', error);
      alert('Failed to update resource status');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Response Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p className="text-sm text-slate-400">No resources registered.</p>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => (
                <Card key={resource._id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="font-medium text-slate-100">
                          {resource.capability}
                        </div>
                        <div className="text-sm text-slate-400">
                          Domain: {resource.domain}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={statusColors[resource.status] || 'bg-muted'}
                          >
                            {resource.status}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {resource.location?.lat.toFixed(4) || resource.lat?.toFixed(4)}, {resource.location?.lng.toFixed(4) || resource.lng?.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Select
                          value={resource.status}
                          onValueChange={(value) => handleStatusChange(resource._id, value)}
                        >
                          <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Deployed">Deployed</SelectItem>
                            <SelectItem value="Unavailable">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
