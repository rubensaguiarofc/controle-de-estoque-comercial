export type Role = 'admin' | 'almoxarife' | 'solicitante';

export const RoleNames: Record<Role, string> = {
  admin: 'Administrador',
  almoxarife: 'Almoxarife',
  solicitante: 'Solicitante',
};

export type UserClaims = {
  role: Role;
};

export function canApprove(role: Role) {
  return role === 'admin' || role === 'almoxarife';
}

export function canWriteInventory(role: Role) {
  return role === 'admin' || role === 'almoxarife';
}

export function canRequest(role: Role) {
  return role === 'admin' || role === 'almoxarife' || role === 'solicitante';
}
