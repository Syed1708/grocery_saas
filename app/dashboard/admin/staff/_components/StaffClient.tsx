"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useCrudModal } from "@/hooks/useCrudModal";
import StaffTab from "./tabs/StaffTab";
import DepartmentsTab from "./tabs/DepartmentsTab";
import AdvancesTab from "./tabs/AdvancesTab";
import PayrollsTab from "./tabs/PayrollsTab";

import DepartmentModal from "./modals/DepartmentModal";
import StaffModal from "./modals/StaffModal";
import AdvanceModal from "./modals/AdvanceModal";
import PayrollModal from "./modals/PayrollModal";

import {
  createOrUpdateDepartmentAction,
  deleteDepartmentAction,
  createOrUpdateStaffAction,
  deleteStaffAction,
  createAdvanceAction,
  deleteAdvanceAction,
  createPayrollAction,
  deletePayrollAction,
} from "@/app/actions/staff-actions";
import { IDepartment, IStaff, ISalaryAdvance, IPayroll } from "@/types";

export default function StaffClient({
  departments,
  staff,
  advances,
  payrolls,
  currencySymbol = "৳",
}: {
  departments: IDepartment[];
  staff: IStaff[];
  advances: ISalaryAdvance[];
  payrolls: IPayroll[];
  currencySymbol?: string;
}) {
  const [activeTab, setActiveTab] = useState<"staff" | "payrolls" | "advances" | "departments">("staff");

  // One universal CRUD engine per entity
  const staffCrud = useCrudModal<IStaff>({
    createAction: createOrUpdateStaffAction,
    updateAction: createOrUpdateStaffAction,
    deleteAction: deleteStaffAction,
    entityName: "কর্মচারী",
  });

  const deptCrud = useCrudModal<IDepartment>({
    createAction: createOrUpdateDepartmentAction,
    updateAction: createOrUpdateDepartmentAction,
    deleteAction: deleteDepartmentAction,
    entityName: "বিভাগ",
  });

  const advanceCrud = useCrudModal<ISalaryAdvance>({
    createAction: createAdvanceAction,
    deleteAction: deleteAdvanceAction,
    entityName: "অগ্রিম বেতন",
  });

  const payrollCrud = useCrudModal<IPayroll>({
    createAction: createPayrollAction,
    deleteAction: deletePayrollAction,
    entityName: "বেতন",
  });

  const totalPayrollMonth = payrolls.filter(p => new Date(p.salaryDate).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.netSalary, 0);
  const pendingAdvances = advances.filter(a => !a.isDeducted).reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Staff & HR Payroll" }]} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Total Staff</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{staff.length} Active</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Monthly Payroll Paid</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">{currencySymbol}{totalPayrollMonth.toFixed(2)}</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Pending Salary Advances</span>
          <span className="text-2xl font-black text-amber-600 font-mono">{currencySymbol}{pendingAdvances.toFixed(2)}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab("staff")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "staff" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            👔 Staff Directory ({staff.length})
          </button>
          <button onClick={() => setActiveTab("payrolls")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "payrolls" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            💵 Monthly Payroll ({payrolls.length})
          </button>
          <button onClick={() => setActiveTab("advances")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "advances" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            ⏳ Salary Advances ({advances.length})
          </button>
          <button onClick={() => setActiveTab("departments")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "departments" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            🏢 Departments ({departments.length})
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "staff" && (
            <button onClick={staffCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Add Employee
            </button>
          )}
          {activeTab === "payrolls" && (
            <button onClick={payrollCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Generate Salary
            </button>
          )}
          {activeTab === "advances" && (
            <button onClick={advanceCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Issue Advance
            </button>
          )}
          {activeTab === "departments" && (
            <button onClick={deptCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Add Department
            </button>
          )}
        </div>
      </div>

      {activeTab === "staff" && <StaffTab staff={staff} onEdit={staffCrud.openEdit} onDelete={staffCrud.setDeleteTarget} />}
      {activeTab === "payrolls" && <PayrollsTab payrolls={payrolls} currencySymbol={currencySymbol} onDelete={payrollCrud.setDeleteTarget} />}
      {activeTab === "advances" && <AdvancesTab advances={advances} currencySymbol={currencySymbol} onDelete={advanceCrud.setDeleteTarget} />}
      {activeTab === "departments" && <DepartmentsTab departments={departments} onEdit={deptCrud.openEdit} onDelete={deptCrud.setDeleteTarget} />}

      {/* MODALS */}
      <DepartmentModal
        key={deptCrud.editingItem?.id || `dept-${deptCrud.isOpen}`}
        isOpen={deptCrud.isOpen}
        onClose={deptCrud.closeModal}
        onSubmit={deptCrud.handleSubmit}
        loading={deptCrud.loading}
        department={deptCrud.editingItem}
        errors={deptCrud.errors}
      />
      <StaffModal
        key={staffCrud.editingItem?.id || `staff-${staffCrud.isOpen}`}
        isOpen={staffCrud.isOpen}
        onClose={staffCrud.closeModal}
        onSubmit={staffCrud.handleSubmit}
        loading={staffCrud.loading}
        staff={staffCrud.editingItem}
        departments={departments}
        errors={staffCrud.errors}
      />
      <AdvanceModal
        key={`advance-${advanceCrud.isOpen}`}
        isOpen={advanceCrud.isOpen}
        onClose={advanceCrud.closeModal}
        onSubmit={advanceCrud.handleSubmit}
        loading={advanceCrud.loading}
        staff={staff}
        currencySymbol={currencySymbol}
        errors={advanceCrud.errors}
      />
      <PayrollModal
        key={`payroll-${payrollCrud.isOpen}`}
        isOpen={payrollCrud.isOpen}
        onClose={payrollCrud.closeModal}
        onSubmit={payrollCrud.handleSubmit}
        loading={payrollCrud.loading}
        staff={staff}
        errors={payrollCrud.errors}
      />

      {/* CONFIRMATION DIALOGS */}
      <ConfirmDialog
        isOpen={Boolean(staffCrud.deleteTarget)}
        onClose={() => staffCrud.setDeleteTarget(null)}
        onConfirm={staffCrud.handleDeleteConfirm}
        title="Delete Employee"
        message={`Delete staff profile for ${staffCrud.deleteTarget?.name}?`}
        loading={staffCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(deptCrud.deleteTarget)}
        onClose={() => deptCrud.setDeleteTarget(null)}
        onConfirm={deptCrud.handleDeleteConfirm}
        title="Delete Department"
        message={`Delete department "${deptCrud.deleteTarget?.name}"?`}
        loading={deptCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(advanceCrud.deleteTarget)}
        onClose={() => advanceCrud.setDeleteTarget(null)}
        onConfirm={advanceCrud.handleDeleteConfirm}
        title="Delete Advance"
        message="Delete this salary advance record?"
        loading={advanceCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(payrollCrud.deleteTarget)}
        onClose={() => payrollCrud.setDeleteTarget(null)}
        onConfirm={payrollCrud.handleDeleteConfirm}
        title="Delete Payslip"
        message="Delete this payroll record?"
        loading={payrollCrud.loading}
      />
    </div>
  );
}
