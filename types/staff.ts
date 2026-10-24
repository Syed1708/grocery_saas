export interface IDepartment {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  _count?: { staff: number };
}

export interface IStaff {
  id: string;
  name: string;
  phone: string;
  emergencyPhone: string | null;
  nidNumber: string | null;
  designation: string;
  joiningDate: Date;
  basicSalary: number;
  dailyAllowance: number;
  overtimeRate: number;
  address: string | null;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED";
  departmentName: string;
  branchName: string;
}

export interface ISalaryAdvance {
  id: string;
  advanceDate: Date;
  amount: number;
  paymentMethod: string;
  purpose: string | null;
  isDeducted: boolean;
  notes: string | null;
  staffName: string;
}

export interface IPayroll {
  id: string;
  payslipNo: string;
  month: string;
  year: number;
  salaryDate: Date;
  basicSalary: number;
  allowance: number;
  overtimeAmount: number;
  advanceDeduction: number;
  penaltyDeduction: number;
  netSalary: number;
  paymentMethod: string;
  paymentStatus: string;
  notes: string | null;
  staffName: string;
  designation: string;
  createdAt: Date;
}