const pad = (value: number) => String(value).padStart(2, "0");

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export { toDateInputValue as formatDateInput };

export interface ProfitLossDateRange {
  startDate: string;
  endDate: string;
}

/**
 * Default P&L period: the latest rolling 365 days.
 * Using a full year avoids comparing a partial month against full monthly
 * payroll/rent, which can make the default view look like a loss.
 */
export function getDefaultProfitLossRange(now = new Date()): ProfitLossDateRange {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - 364);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}
