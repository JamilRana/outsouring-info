// components/reports/EditModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Designation } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmissionFormData, submissionSchema } from "../../../lib/validation";
import {
  getSubmissionById,
  updateSubmission,
} from "../../api/reports/facility/route";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  designations: Designation[];
  onSuccess: () => void;
}

export default function EditModal({
  isOpen,
  onClose,
  submissionId,
  designations,
  onSuccess,
}: EditModalProps) {
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      id: submissionId,
      p_designation: "",
      salary: 0,
      total_post: 0,
      male: 0,
      female: 0,
    },
  });

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen && !initialDataLoaded) {
      const loadSubmission = async () => {
        try {
          const data = await getSubmissionById(submissionId);
          reset({
            id: data.id,
            p_designation: data.designationId,
            salary: data.consolidatedSalary,
            total_post: data.totalPost,
            male: data.male,
            female: data.female,
          });
          setInitialDataLoaded(true);
        } catch (error) {
          console.error("Failed to load submission:", error);
          alert("Failed to load submission data");
          onClose();
        }
      };
      loadSubmission();
    }
  }, [isOpen, submissionId, reset, onClose, initialDataLoaded]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInitialDataLoaded(false);
      reset();
    }
  }, [isOpen, reset]);

  const male = watch("male") || 0;
  const female = watch("female") || 0;
  const totalPost = watch("total_post") || 0;
  const totalManpower = male + female;
  const vacant = Math.max(0, totalPost - totalManpower);

  const onSubmit = async (data: SubmissionFormData) => {
    setLoading(true);
    try {
      await updateSubmission(data);
      onSuccess();
      onClose();
      alert("Submission updated successfully!");
    } catch (error: any) {
      console.error("Update error:", error);
      alert(error.message || "Failed to update submission");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Edit Submission</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("id")} />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Post Name <span className="text-red-500">*</span>
              </label>
              <select
                {...register("p_designation")}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Post</option>
                {designations.map((des) => (
                  <option key={des.id} value={des.id}>
                    {des.category} • {des.name}
                  </option>
                ))}
              </select>
              {errors.p_designation && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.p_designation.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consolidated Salary <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("salary", { valueAsNumber: true })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {errors.salary && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.salary.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Post <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("total_post", { valueAsNumber: true })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {errors.total_post && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.total_post.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-800 mb-3">
                Existing Manpower
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Male <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register("male", { valueAsNumber: true })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  {errors.male && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.male.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Female <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register("female", { valueAsNumber: true })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  {errors.female && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.female.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Manpower
                </label>
                <p className="text-lg font-semibold text-gray-800">
                  {totalManpower}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vacant Posts
                </label>
                <p className="text-lg font-semibold text-gray-800">{vacant}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
