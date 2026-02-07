// Models
import User from './user.model';
import Property from './property.model';
import Unit from './unit.model';
import Tenant from './tenant.model';
import Lease from './lease.model';
import Invoice from './invoice.model';
import Payment from './payment.model';
import Expense from './expense.model';

// ============================================
// العلاقات بين الجداول (Associations)
// ============================================

// User -> User (Self-referencing: Owner -> Team Members)
User.hasMany(User, { foreignKey: 'parentId', as: 'teamMembers' });
User.belongsTo(User, { foreignKey: 'parentId', as: 'parent' });

// User -> Property (Owner owns Properties)
User.hasMany(Property, { foreignKey: 'ownerId', as: 'properties' });
Property.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User -> Tenant (Owner added Tenants)
User.hasMany(Tenant, { foreignKey: 'ownerId', as: 'tenants' });
Tenant.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Property -> Unit
Property.hasMany(Unit, { foreignKey: 'propertyId', as: 'units' });
Unit.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// Unit -> Lease
Unit.hasMany(Lease, { foreignKey: 'unitId', as: 'leases' });
Lease.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// Tenant -> Lease
Tenant.hasMany(Lease, { foreignKey: 'tenantId', as: 'leases' });
Lease.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Lease -> Invoice
Lease.hasMany(Invoice, { foreignKey: 'leaseId', as: 'invoices' });
Invoice.belongsTo(Lease, { foreignKey: 'leaseId', as: 'lease' });

// Invoice -> Payment
Invoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// User -> Payment (من سجل الدفعة)
User.hasMany(Payment, { foreignKey: 'createdById', as: 'recordedPayments' });
Payment.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// Property -> Expense
Property.hasMany(Expense, { foreignKey: 'propertyId', as: 'expenses' });
Expense.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// Unit -> Expense (Optional)
Unit.hasMany(Expense, { foreignKey: 'unitId', as: 'expenses' });
Expense.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// User -> Expense (من سجل المصروف)
User.hasMany(Expense, { foreignKey: 'createdById', as: 'recordedExpenses' });
Expense.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// Export all models
export {
    User,
    Property,
    Unit,
    Tenant,
    Lease,
    Invoice,
    Payment,
    Expense,
};

// Export enums
export { UserRole } from './user.model';
export { PropertyType } from './property.model';
export { UnitStatus } from './unit.model';
export { LeaseStatus, PaymentFrequency } from './lease.model';
export { InvoiceStatus } from './invoice.model';
export { PaymentMethod } from './payment.model';
export { ExpenseCategory } from './expense.model';
