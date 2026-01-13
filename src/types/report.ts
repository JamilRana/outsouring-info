// types/report.ts
import { Submission } from "@prisma/client";

export type ReportData = Submission & {
  designation: Designation;
  user: {
    facilityName: string | null;
    division: string | null;
    district: string | null;
    upazila: string | null;
  } | null;
};

export interface ReportTableProps {
  data: ReportData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
  designations: Designation[];
  onEditSuccess: () => void;
}

export interface Designation {
  id: string;
  name: string;
  category: string;
}

export interface ReportFilters {
  facilityCode: string;
  designationId: string;
  dateFrom: string;
  dateTo: string;
}
