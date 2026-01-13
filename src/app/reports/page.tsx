// app/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  getDesignations,
  getFacilities,
  getReportData,
} from "../api/reports/facility/route";
import ProtectedRoute from "../../components/ProtectedRoute";
import FilterBar from "./components/FilterBar";
import ReportTable from "./components/ReportTable";

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [designations, setDesignations] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    facilityCode: "",
    designationId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditSuccess = () => {
    setRefreshKey((prev) => prev + 1); // Trigger data reload
  };

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const result = await getReportData(page, 10, filters);
      setData(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Failed to load reports:", error);
      alert("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [desRes, facRes] = await Promise.all([
          getDesignations(),
          getFacilities(),
        ]);
        setDesignations(desRes);
        setFacilities(facRes);
        await loadData();
      } catch (error) {
        console.error("Failed to load dependencies:", error);
      }
    };
    fetchData();
  }, []);

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    loadData(1);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
    loadData(page);
  };

  return (
    <ProtectedRoute allowedRoles={["EXPORTER", "SUBMITTER"]}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Outsourcing Manpower Reports
        </h1>

        <FilterBar
          designations={designations}
          facilities={facilities}
          onFilter={handleFilter}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ReportTable
            data={data}
            pagination={pagination}
            onPageChange={handlePageChange}
            designations={designations}
            onEditSuccess={handleEditSuccess}
            key={refreshKey}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
