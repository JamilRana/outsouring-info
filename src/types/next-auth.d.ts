import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    name: string | null;
    email: string;
    role: "SUBMITTER" | "EXPORTER";
    // Only populated for SUBMITTERs
    facilityCode?: string;
    facilityName?: string;
    facilityType?: string;
    division?: string;
    district?: string;
    upazila?: string;
  }

  interface Session {
    user: User & {
      id: string;
      name: string | null;
      email: string;
      role: "SUBMITTER" | "EXPORTER";
      facilityCode?: string;
      facilityName?: string;
      facilityType?: string;
      division?: string;
      district?: string;
      upazila?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string | null;
    email: string;
    role: "SUBMITTER" | "EXPORTER";
    // Only populated for SUBMITTERs
    facilityCode?: string;
    facilityName?: string;
    facilityType?: string;
    division?: string;
    district?: string;
    upazila?: string;
  }
}
