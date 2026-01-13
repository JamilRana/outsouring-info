// components/reports/FilterBar.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Designation, ReportFilters } from "../../../types/report";

interface FilterBarProps {
  designations: Designation[];
  facilities: { facilityCode: string; facilityName: string }[];
  onFilter: (filters: ReportFilters) => void;
}

export default function FilterBar({
  designations,
  facilities,
  onFilter,
}: FilterBarProps) {
  const [filters, setFilters] = useState({
    facilityCode: "",
    designationId: "",
    dateFrom: "",
    dateTo: "",
  });
  const { data: session } = useSession();
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    const emptyFilters = {
      facilityCode: "",
      designationId: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(emptyFilters);
    onFilter(emptyFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {session?.user?.role === "EXPORTER" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facility
            </label>
            <select
              name="facilityCode"
              value={filters.facilityCode}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Facilities</option>
              {facilities.map((fac) => (
                <option key={fac.facilityCode} value={fac.facilityCode}>
                  {fac.facilityName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Designation
          </label>
          <select
            name="designationId"
            value={filters.designationId}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Designations</option>
            {designations.map((des) => (
              <option key={des.id} value={des.id}>
                {des.category} • {des.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex items-end space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
