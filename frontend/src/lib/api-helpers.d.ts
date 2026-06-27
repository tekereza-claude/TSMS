import { NextResponse } from "next/server";
import { UserRole } from "@/types";
export declare function requireRole(...roles: UserRole[]): Promise<{
    error: NextResponse<{
        error: string;
    }>;
    session: null;
} | {
    error: null;
    session: any;
}>;
export declare function ok(data: unknown, status?: number): NextResponse<unknown>;
export declare function err(message: string, status?: number): NextResponse<{
    error: string;
}>;
//# sourceMappingURL=api-helpers.d.ts.map