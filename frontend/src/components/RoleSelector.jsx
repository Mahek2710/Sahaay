import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, Building2, User } from 'lucide-react';
import { setRole, ROLES } from '@/utils/auth';

export default function RoleSelector({ onRoleSelect }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: ROLES.CITIZEN,
      name: 'Citizen',
      description: 'Report emergencies and view incidents',
      icon: User,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: ROLES.VOLUNTEER,
      name: 'Volunteer',
      description: 'Opt to help with active incidents',
      icon: Users,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: ROLES.COORDINATOR,
      name: 'Coordinator',
      description: 'Manage incidents and assign resources',
      icon: Shield,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      id: ROLES.AGENCY,
      name: 'Agency',
      description: 'Manage resources and view domain incidents',
      icon: Building2,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  const handleSelectRole = (roleId) => {
    setRole(roleId);
    if (onRoleSelect) {
      onRoleSelect(roleId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">SAHAAY</h1>
          <p className="text-slate-400">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className={`bg-slate-800 border-slate-700 cursor-pointer transition-all hover:border-slate-500 ${
                  selectedRole === role.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`${role.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-100 mb-1">
                        {role.name}
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        {role.description}
                      </p>
                      <Button
                        className={`w-full ${role.color} text-white`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRole(role.id);
                        }}
                      >
                        Continue as {role.name}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}