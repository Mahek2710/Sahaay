export const ROLE_PERMISSIONS = {
  CITIZEN: [],

  VOLUNTEER: [
    "VIEW_SELF"
  ],

  DONOR: [
    "VIEW_SELF"
  ],

  COORDINATOR: [
    "VIEW_USERS",
    "MANAGE_VOLUNTEERS"
  ],

  AGENCY: [
    "VIEW_USERS",
    "MANAGE_VOLUNTEERS"
  ]
};
