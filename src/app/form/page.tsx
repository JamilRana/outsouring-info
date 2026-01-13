"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import axios from "axios";
import ProtectedRoute from "../../components/ProtectedRoute";
import { motion } from "framer-motion";

type FormData = {
  p_designation: string;
  salary: number;
  total_post: number;
  male: number;
  female: number;
};

export default function InputForm() {
  const { data: session } = useSession();
  const [designations, setDesignations] = useState<
    { id: string; name: string; category: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      p_designation: "",
      salary: 0,
      total_post: 0,
      male: 0,
      female: 0,
    },
  });

  const male = watch("male") || 0;
  const female = watch("female") || 0;
  const totalPost = watch("total_post") || 0;
  const totalManpower = male + female;
  const vacant = Math.max(0, totalPost - totalManpower);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await axios.get("/api/designation");
        setDesignations(res.data);
      } catch (error) {
        console.error("Failed to load designations", error);
      }
    };
    fetchDesignations();
  }, []);

  // In your form component
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      // Ensure proper data types
      const payload = {
        p_designation: data.p_designation, // Should be ID string
        salary: parseFloat(data.salary.toString()), // Convert to number
        total_post: parseInt(data.total_post.toString(), 10),
        male: parseInt(data.male.toString(), 10) || 0,
        female: parseInt(data.female.toString(), 10) || 0,
      };

      console.log("Submitting payload:", payload); // Debug log

      await axios.post("/api/submitForm", payload);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      // Show detailed error
      const errorMessage = error.response?.data?.error || "Submission failed";
      alert(`Error: ${errorMessage}`);
      console.error("Submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUBMITTER"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-500 p-6">
              <h1 className="text-2xl font-bold text-white">
                {session?.user.facilityName}
              </h1>
              <p className="text-blue-100 mt-1">
                {session?.user.division} • {session?.user.district} •{" "}
                {session?.user.upazila}
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Existing Manpower under Outsourcing Rules-2018
                </h2>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-700 font-medium">
                Form submitted successfully!
              </span>
            </motion.div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Post Name */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Name
                  </label>
                  <div className="relative">
                    <select
                      {...register("p_designation", { required: true })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      <option value="">Select Post Designation</option>
                      {designations.map((des) => (
                        <option key={des.id} value={des.id}>
                          {" "}
                          {des.category} • {des.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  {errors.p_designation && (
                    <p className="mt-1 text-sm text-red-600">
                      This field is required
                    </p>
                  )}
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consolidated Salary <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">৳</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("salary", {
                        required: true,
                        min: 0,
                        valueAsNumber: true,
                      })}
                      className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.salary && (
                    <p className="mt-1 text-sm text-red-600">
                      Valid salary required
                    </p>
                  )}
                </div>

                {/* Total Post */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Post <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register("total_post", {
                      required: true,
                      min: 0,
                      valueAsNumber: true,
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter total posts"
                  />
                  {errors.total_post && (
                    <p className="mt-1 text-sm text-red-600">
                      Valid number required
                    </p>
                  )}
                </div>
              </div>

              {/* Manpower Section */}
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Existing Manpower Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Male Staff <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="number"
                        min="0"
                        {...register("male", {
                          required: true,
                          min: 0,
                          valueAsNumber: true,
                        })}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    {errors.male && (
                      <p className="mt-1 text-sm text-red-600">
                        Valid number required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Female Staff <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-pink-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="number"
                        min="0"
                        {...register("female", {
                          required: true,
                          min: 0,
                          valueAsNumber: true,
                        })}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="0"
                      />
                    </div>
                    {errors.female && (
                      <p className="mt-1 text-sm text-red-600">
                        Valid number required
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculated Fields */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Total Manpower
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {totalManpower}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center">
                    <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">
                        Vacant Posts
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {vacant}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Submit Form
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Directorate General of Health Services
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
