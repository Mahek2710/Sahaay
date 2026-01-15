export const ROLES = {
  CITIZEN: 'CITIZEN',
  VOLUNTEER: 'VOLUNTEER',
  COORDINATOR: 'COORDINATOR',
  AGENCY: 'AGENCY',
};

export function getRole() {
  return localStorage.getItem('role') || null;
}

export function setRole(role) {
  localStorage.setItem('role', role);
}

export function clearRole() {
  localStorage.removeItem('role');
}

export function hasPermission(role, action) {
  switch (role) {
    case ROLES.COORDINATOR:
      return ['view', 'allocate', 'resolve', 'assign'].includes(action);
    case ROLES.AGENCY:
      return ['view', 'manage', 'allocate', 'resolve', 'analytics'].includes(action);
    case ROLES.VOLUNTEER:
      return ['view', 'opt-in'].includes(action);
    case ROLES.CITIZEN:
    default:
      return ['view', 'report'].includes(action);
  }
}
