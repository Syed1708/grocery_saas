"use server";

import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { departmentSchema, staffSchema, advanceSchema, payrollSchema } from "@/lib/validations";

// ==========================================
// 1. DEPARTMENTS CRUD
// ==========================================

export async function createOrUpdateDepartmentAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const id = formData.get("id")?.toString();

    const validated = departmentSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      code: formData.get("code")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || null,
      status: formData.get("status")?.toString() || "active",
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    if (id) {
      await prisma.department.update({
        where: { id, shopId: user.shopId },
        data,
      });
    } else {
      await prisma.department.create({
        data: { ...data, shopId: user.shopId },
      });
    }

    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save department." };
  }
}

export async function deleteDepartmentAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const dept = await prisma.department.findFirst({
      where: { id, shopId: user.shopId },
      include: { _count: { select: { staff: true } } },
    });
    if (!dept) return { success: false, error: "Department not found." };
    if (dept._count.staff > 0) {
      return { success: false, error: `Cannot delete: ${dept._count.staff} staff members are assigned here.` };
    }

    await prisma.department.delete({ where: { id } });
    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete department." };
  }
}

// ==========================================
// 2. STAFF PROFILE CRUD
// ==========================================

export async function createOrUpdateStaffAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const id = formData.get("id")?.toString();

    const validated = staffSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim(),
      emergencyPhone: formData.get("emergencyPhone")?.toString().trim() || null,
      nidNumber: formData.get("nidNumber")?.toString().trim() || null,
      departmentId: formData.get("departmentId")?.toString(),
      designation: formData.get("designation")?.toString().trim(),
      joiningDate: formData.get("joiningDate")?.toString(),
      basicSalary: formData.get("basicSalary"),
      dailyAllowance: formData.get("dailyAllowance") || 0,
      overtimeRate: formData.get("overtimeRate") || 0,
      address: formData.get("address")?.toString().trim() || null,
      status: formData.get("status")?.toString() || "ACTIVE",
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    if (id) {
      await prisma.staffProfile.update({
        where: { id, shopId: user.shopId },
        data: {
          ...data,
          joiningDate: new Date(data.joiningDate),
        },
      });
    } else {
      await prisma.staffProfile.create({
        data: {
          ...data,
          joiningDate: new Date(data.joiningDate),
          branchId: user.activeBranchId!,
          shopId: user.shopId,
        },
      });
    }

    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save staff profile." };
  }
}

export async function deleteStaffAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const staff = await prisma.staffProfile.findFirst({
      where: { id, shopId: user.shopId },
      include: { _count: { select: { payrolls: true } } },
    });
    if (!staff) return { success: false, error: "Staff profile not found." };
    if (staff._count.payrolls > 0) {
      return { success: false, error: "Cannot delete employee with payroll records. Set status to Inactive or Terminated instead." };
    }

    await prisma.staffProfile.delete({ where: { id } });
    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete staff profile." };
  }
}

// ==========================================
// 3. SALARY ADVANCES (হাওলাত) CRUD
// ==========================================

export async function createAdvanceAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const validated = advanceSchema.safeParse({
      staffId: formData.get("staffId")?.toString(),
      advanceDate: formData.get("advanceDate")?.toString(),
      amount: formData.get("amount"),
      paymentMethod: formData.get("paymentMethod")?.toString() || "cash",
      purpose: formData.get("purpose")?.toString().trim() || null,
      notes: formData.get("notes")?.toString().trim() || null,
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    await prisma.$transaction(async (tx) => {
      await tx.salaryAdvance.create({
        data: {
          ...data,
          advanceDate: new Date(data.advanceDate),
          branchId: user.activeBranchId!,
          shopId: user.shopId,
        },
      });

      const cashAcc = await tx.account.findFirst({
        where: { shopId: user.shopId, branchId: user.activeBranchId!, type: "CASH" },
      });
      if (cashAcc) {
        const newBal = Number(cashAcc.currentBalance) - data.amount;
        await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
      }
    });

    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to issue advance." };
  }
}

export async function deleteAdvanceAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const adv = await prisma.salaryAdvance.findFirst({ where: { id, shopId: user.shopId } });
    if (!adv) return { success: false, error: "Advance record not found." };
    if (adv.isDeducted) {
      return { success: false, error: "Cannot delete an advance that has already been deducted from monthly payroll." };
    }

    await prisma.salaryAdvance.delete({ where: { id } });
    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete advance." };
  }
}

// ==========================================
// 4. MONTHLY PAYROLL CRUD
// ==========================================

export async function createPayrollAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const validated = payrollSchema.safeParse({
      staffId: formData.get("staffId")?.toString(),
      month: formData.get("month")?.toString(),
      year: formData.get("year"),
      salaryDate: formData.get("salaryDate")?.toString(),
      basicSalary: formData.get("basicSalary"),
      allowance: formData.get("allowance") || 0,
      overtimeAmount: formData.get("overtimeAmount") || 0,
      advanceDeduction: formData.get("advanceDeduction") || 0,
      penaltyDeduction: formData.get("penaltyDeduction") || 0,
      paymentMethod: formData.get("paymentMethod")?.toString() || "cash",
      notes: formData.get("notes")?.toString().trim() || null,
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    const existing = await prisma.payroll.findFirst({
      where: { shopId: user.shopId, staffId: data.staffId, month: data.month, year: data.year },
    });
    if (existing) {
      return { success: false, error: `Salary for ${data.month} ${data.year} has already been paid.` };
    }

    const netSalary = Math.max(0, (data.basicSalary + data.allowance + data.overtimeAmount) - (data.advanceDeduction + data.penaltyDeduction));
    const payslipNo = `PAY-${data.year}-${data.month.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    await prisma.$transaction(async (tx) => {
      await tx.payroll.create({
        data: {
          payslipNo,
          month: data.month,
          year: data.year,
          salaryDate: new Date(data.salaryDate),
          basicSalary: data.basicSalary,
          allowance: data.allowance,
          overtimeAmount: data.overtimeAmount,
          advanceDeduction: data.advanceDeduction,
          penaltyDeduction: data.penaltyDeduction,
          netSalary,
          paymentMethod: data.paymentMethod,
          paymentStatus: "paid",
          notes: data.notes,
          branchId: user.activeBranchId!,
          staffId: data.staffId,
          shopId: user.shopId,
        },
      });

      if (data.advanceDeduction > 0) {
        await tx.salaryAdvance.updateMany({
          where: { staffId: data.staffId, isDeducted: false, shopId: user.shopId },
          data: { isDeducted: true },
        });
      }

      const cashAcc = await tx.account.findFirst({
        where: { shopId: user.shopId, branchId: user.activeBranchId!, type: "CASH" },
      });
      if (cashAcc) {
        const newBal = Number(cashAcc.currentBalance) - netSalary;
        await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
      }
    });

    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate payroll." };
  }
}

export async function deletePayrollAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    await prisma.payroll.delete({ where: { id, shopId: user.shopId } });
    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete payroll record." };
  }
}