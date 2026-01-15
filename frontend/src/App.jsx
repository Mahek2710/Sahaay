import { useState, useEffect } from 'react';
import { getRole } from '@/utils/auth';
import RoleSelector from '@/components/RoleSelector';
import CitizenDashboard from '@/components/CitizenDashboard';
import VolunteerDashboard from '@/components/VolunteerDashboard';
import CoordinatorDashboard from '@/components/ResponseDesk';
import AgencyDashboard from '@/components/AgencyDashboard';

function App() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  // If no role selected, show role selector
  if (!role) {
    return <RoleSelector onRoleSelect={(selectedRole) => {
      setRole(selectedRole);
    }} />;
  }

  // Render dashboard based on role
  switch (role) {
    case 'CITIZEN':
      return <CitizenDashboard onRoleChange={() => setRole(null)} />;
    case 'VOLUNTEER':
      return <VolunteerDashboard onRoleChange={() => setRole(null)} />;
    case 'COORDINATOR':
      return <CoordinatorDashboard onRoleChange={() => setRole(null)} />;
    case 'AGENCY':
      return <AgencyDashboard onRoleChange={() => setRole(null)} />;
    default:
      return <RoleSelector onRoleSelect={(selectedRole) => {
        setRole(selectedRole);
      }} />;
  }
}

export default App;