import type { FeatureFlagSnapshot } from "./types";

export type LoanStatus = "draft" | "submitted" | "approved" | "disbursed" | "repaid";

export interface LoanApplication {
  readonly loanId: string;
  readonly memberId: string;
  readonly amount: number;
  readonly purpose: string;
  readonly createdAt: Date;
  readonly tenantId: string;
  status: LoanStatus;
  readonly repaymentTermMonths: number;
}

export class LoanService {
  private readonly applications = new Map<string, LoanApplication>();

  constructor(private readonly flags: FeatureFlagSnapshot) {}

  submit(application: Omit<LoanApplication, "status" | "createdAt">): LoanApplication {
    if (!this.flags.memberLoans) {
      throw new Error("Member loans are disabled for this tenant");
    }
    const record: LoanApplication = {
      ...application,
      createdAt: new Date(),
      status: "submitted",
    };
    this.applications.set(record.loanId, record);
    return record;
  }

  transition(loanId: string, status: LoanStatus): LoanApplication {
    const record = this.applications.get(loanId);
    if (!record) {
      throw new Error("Loan application not found");
    }
    record.status = status;
    this.applications.set(loanId, record);
    return record;
  }

  get(loanId: string): LoanApplication | undefined {
    return this.applications.get(loanId);
  }

  listByMember(memberId: string): readonly LoanApplication[] {
    return Array.from(this.applications.values()).filter((loan) => loan.memberId === memberId);
  }
}
