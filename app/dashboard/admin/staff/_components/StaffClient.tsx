"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
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

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  const [editingStaff, setEditingStaff] = useState<IStaff | null>(null);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);

  const [deleteStaffTarget, setDeleteStaffTarget] = useState<IStaff | null>(null);
  const [deleteDeptTarget, setDeleteDeptTarget] = useState<IDepartment | null>(null);
  const [deleteAdvanceTarget, setDeleteAdvanceTarget] = useState<ISalaryAdvance | null>(null);
  const [deletePayrollTarget, setDeletePayrollTarget] = useState<IPayroll | null>(null);

  const [loading, setLoading] = useState(false);

  const totalPayrollMonth = payrolls.filter(p => new Date(p.salaryDate).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.netSalary, 0);
  const pendingAdvances = advances.filter(a => !a.isDeducted).reduce((sum, a) => sum + a.amount, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, action: (fd: FormData) => Promise<any>, successMsg: string, setter: (b: boolean) => void) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await action(formData);
    setLoading(false);
    if (res.success) {
      toast.success(successMsg);
      setter(false);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

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
            <button onClick={() => { setEditingStaff(null); setStaffModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Add Employee
            </button>
          )}
          {activeTab === "payrolls" && (
            <button onClick={() => setPayrollModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Generate Salary
            </button>
          )}
          {activeTab === "advances" && (
            <button onClick={() => setAdvanceModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Issue Advance
            </button>
          )}
          {activeTab === "departments" && (
            <button onClick={() => { setEditingDept(null); setDeptModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Add Department
            </button>
          )}
        </div>
      </div>

      {activeTab === "staff" && <StaffTab staff={staff} onEdit={(s) => { setEditingStaff(s); setStaffModalOpen(true); }} onDelete={setDeleteStaffTarget} />}
      {activeTab === "payrolls" && <PayrollsTab payrolls={payrolls} currencySymbol={currencySymbol} onDelete={setDeletePayrollTarget} />}
      {activeTab === "advances" && <AdvancesTab advances={advances} currencySymbol={currencySymbol} onDelete={setDeleteAdvanceTarget} />}
      {activeTab === "departments" && <DepartmentsTab departments={departments} onEdit={(d) => { setEditingDept(d); setDeptModalOpen(true); }} onDelete={setDeleteDeptTarget} />}

      {/* MODALS */}
      <DepartmentModal isOpen={deptModalOpen} onClose={() => { setDeptModalOpen(false); setEditingDept(null); }} onSubmit={(e) => handleSubmit(e, createOrUpdateDepartmentAction, "Department saved!", setDeptModalOpen)} loading={loading} department={editingDept} />
      <StaffModal isOpen={staffModalOpen} onClose={() => { setStaffModalOpen(false); setEditingStaff(null); }} onSubmit={(e) => handleSubmit(e, createOrUpdateStaffAction, "Staff profile saved!", setStaffModalOpen)} loading={loading} staff={editingStaff} departments={departments} />
      <AdvanceModal isOpen={advanceModalOpen} onClose={() => setAdvanceModalOpen(false)} onSubmit={(e) => handleSubmit(e, createAdvanceAction, "Advance issued!", setAdvanceModalOpen)} loading={loading} staff={staff} currencySymbol={currencySymbol} />
      <PayrollModal isOpen={payrollModalOpen} onClose={() => setPayrollModalOpen(false)} onSubmit={(e) => handleSubmit(e, createPayrollAction, "Payroll generated!", setPayrollModalOpen)} loading={loading} staff={staff} />

      {/* CONFIRMATION DIALOGS */}
      <ConfirmDialog isOpen={Boolean(deleteStaffTarget)} onClose={() => setDeleteStaffTarget(null)} onConfirm={async () => { setLoading(true); await deleteStaffAction(deleteStaffTarget!.id); setLoading(false); setDeleteStaffTarget(null); toast.success("Staff profile deleted."); }} title="Delete Employee" message={`Delete staff profile for ${deleteStaffTarget?.name}?`} loading={loading} />
      <ConfirmDialog isOpen={Boolean(deleteDeptTarget)} onClose={() => setDeleteDeptTarget(null)} onConfirm={async () => { setLoading(true); const res = await deleteDepartmentAction(deleteDeptTarget!.id); setLoading(false); setDeleteDeptTarget(null); if(res.success) toast.success("Department deleted."); else toast.error(res.error); }} title="Delete Department" message={`Delete department "${deleteDeptTarget?.name}"?`} loading={loading} />
      <ConfirmDialog isOpen={Boolean(deleteAdvanceTarget)} onClose={() => setDeleteAdvanceTarget(null)} onConfirm={async () => { setLoading(true); await deleteAdvanceAction(deleteAdvanceTarget!.id); setLoading(false); setDeleteAdvanceTarget(null); toast.success("Advance deleted."); }} title="Delete Advance" message="Delete this salary advance record?" loading={loading} />
      <ConfirmDialog isOpen={Boolean(deletePayrollTarget)} onClose={() => setDeletePayrollTarget(null)} onConfirm={async () => { setLoading(true); await deletePayrollAction(deletePayrollTarget!.id); setLoading(false); setDeletePayrollTarget(null); toast.success("Payslip deleted."); }} title="Delete Payslip" message="Delete this payroll record?" loading={loading} />
    </div>
  );
}