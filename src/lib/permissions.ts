import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

/**
 * Custom permission statements for Loko logistics app
 * Defines what actions each resource supports
 */
export const statement = {
  ...defaultStatements,
  delivery: ['create', 'view', 'update', 'assign', 'complete'],
  deliveryPoint: ['create', 'view', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statement);

/**
 * Admin role - Full access to everything
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  delivery: ['create', 'view', 'update', 'assign', 'complete'],
  deliveryPoint: ['create', 'view', 'update', 'delete'],
});

/**
 * Courier role - Can view and complete assigned deliveries
 */
export const courier = ac.newRole({
  delivery: ['view', 'complete'],
  deliveryPoint: ['view'],
});

/**
 * Client role - Can create deliveries and view their own
 */
export const client = ac.newRole({
  delivery: ['create', 'view'],
  deliveryPoint: ['create', 'view'],
});
