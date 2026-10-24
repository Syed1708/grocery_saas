import { prisma } from "@/lib/prisma";
import { IDepartment, IStaff, ISalaryAdvance, IPayroll } from "@/types";

export async function getDepartments(shopId: string): Promise<IDepartment[]> {
  const depts = await prisma.department.findMany({
    where: { shopId },
    include: { _count: { select: { staff: true } } },
    orderBy: { name: "asc" },
  });

  return depts.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    description: d.description,
    status: d.status,
    _count: d._count,
  }));
}

export async function getStaffList(shopId: string): Promise<IStaff[]> {
  const staff = await prisma.staffProfile.findMany({
    where: { shopId },
    include: {
      department: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return staff.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    emergencyPhone: s.emergencyPhone,
    nidNumber: s.nidNumber,
    designation: s.designation,
    joiningDate: s.joiningDate,
    basicSalary: Number(s.basicSalary),
    dailyAllowance: Number(s.dailyAllowance),
    overtimeRate: Number(s.overtimeRate),
    address: s.address,
    status: s.status,
    departmentName: s.department.name,
    branchName: s.branch.name,
  }));
}

export async function getAdvances(shopId: string): Promise<ISalaryAdvance[]> {
  const advs = await prisma.salaryAdvance.findMany({
    where: { shopId },
    include: { staff: { select: { name: true } } },
    orderBy: { advanceDate: "desc" },
  });

  return advs.map((a) => ({
    id: a.id,
    advanceDate: a.advanceDate,
    amount: Number(a.amount),
    paymentMethod: a.paymentMethod,
    purpose: a.purpose,
    isDeducted: a.isDeducted,
    notes: a.notes,
    staffName: a.staff.name,
  }));
}

export async function getPayrolls(shopId: string): Promise<IPayroll[]> {
  const pay = await prisma.payroll.findMany({
    where: { shopId },
    include: { staff: { select: { name: true, designation: true } } },
    orderBy: { salaryDate: "desc" },
  });

  return pay.map((p) => ({
    id: p.id,
    payslipNo: p.payslipNo,
    month: p.month,
    year: p.year,
    salaryDate: p.salaryDate,
    basicSalary: Number(p.basicSalary),
    allowance: Number(p.allowance),
    overtimeAmount: Number(p.overtimeAmount),
    advanceDeduction: Number(p.advanceDeduction),
    penaltyDeduction: Number(p.penaltyDeduction),
    netSalary: Number(p.netSalary),
    paymentMethod: p.paymentMethod,
    paymentStatus: p.paymentStatus,
    notes: p.notes,
    staffName: p.staff.name,
    designation: p.staff.designation,
    createdAt: p.createdAt,
  }));
}