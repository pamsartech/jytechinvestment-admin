import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaDownload } from "react-icons/fa";
import { IoFilterOutline } from "react-icons/io5";
import { LuArrowDownUp } from "react-icons/lu";
import { IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Skeleton from "@mui/material/Skeleton";

const SkeletonRow = () => {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-3">
          <Skeleton
            variant="rectangular"
            height={24}
            sx={{ borderRadius: "6px" }}
          />
        </td>
      ))}
    </tr>
  );
};

const PAGE_SIZE = 9;

const STATUS_UI = {
  // Deleted: { pill: "bg-gray-200 px-2 py-2 text-gray-700", downloadable: false },
  New: { pill: "bg-blue-100 text px-6 py-2 blue-700", downloadable: true },
  Edited: {
    pill: "bg-yellow-100 px-5 py-2 text-yellow-700",
    downloadable: true,
  },
};

const REPORT_TYPE_UI = {
  purchase: {
    label: "Complète",
    pill: "bg-green-100 text-green-700",
  },
  draft: {
    label: "Brouillon",
    pill: "bg-blue-100 px-7 text-blue-700",
  },
  deleted: {
    label: "Supprimé",
    pill: "bg-gray-200 text-gray-600",
  },
};

export default function Report() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [sortOption, setSortOption] = useState("report-asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const [page, setPage] = useState(1);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        "https://api.emibocquillon.fr/admin/projects/all",
        authConfig,
      );

      const mapped = res.data.projects.map((item) => ({
        id: item._id,
        customerName: item.userName,
        reportId: item._id,
        type: item.type,
        date: new Date(item.createdAt),
        status: item.status || "New",
      }));

      setReports(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER + SORT ---------------- */
  const filteredData = useMemo(() => {
    let data = [...reports];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.reportId.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "All") {
      data = data.filter((r) => r.status === statusFilter);
    }

    data.sort((a, b) => {
      switch (sortOption) {
        case "report-asc":
          return a.reportId.localeCompare(b.reportId);
        case "report-desc":
          return b.reportId.localeCompare(a.reportId);
        case "date-new":
          return b.date - a.date;
        case "date-old":
          return a.date - b.date;
        default:
          return 0;
      }
    });

    return data;
  }, [reports, search, statusFilter, sortOption]);

  const isDownloadAllowed = (reportType) => reportType === "purchase";

  // download functionality
  const handleDownload = async (report) => {
    if (report.type !== "purchase") return;

    try {
      setDownloadingId(report.id);

      const response = await axios.get(
        `https://api.emibocquillon.fr/admin/projects/generate-report/${report.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${report.id}.pdf`;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const paginatedData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const getPages = () => {
    const pages = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);
      if (page > 4) pages.push("…");
      if (page > 3 && page < totalPages - 2) pages.push(page);
      if (page < totalPages - 3) pages.push("…");
      pages.push(totalPages - 1, totalPages);
    }
    return [...new Set(pages)];
  };

  return (
    <div>
      <Navbar heading="Gestion des rapports" />

      <div className="p-6 mt-5 bg-gray-50 min-h-screen">
        {/* ---------------- TOP CONTROLS ---------------- */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou par identifiant"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg"
            />
          </div>

          {/* FILTER */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2"
            >
              <IoFilterOutline size={22} />
              Filtrer
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border p-1 rounded-lg shadow-md z-10">
                {["All", "New", "Edited", "Deleted"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setShowFilterMenu(false);
                      setPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      statusFilter === status ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    {status === "All" ? "All status" : status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SORT */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2"
            >
              <LuArrowDownUp size={20} />
              Trier
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border p-1 rounded-lg shadow-md z-10">
                {[
                  ["report-asc", "Report ID (A–Z)"],
                  ["report-desc", "Report ID (Z–A)"],
                  ["date-new", "Date Created (Newest)"],
                  ["date-old", "Date Created (Oldest)"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setSortOption(value);
                      setShowSortMenu(false);
                      setPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      sortOption === value ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------------- STATES ---------------- */}

        {error && <div className="text-center py-20 text-red-500">{error}</div>}

        { !error && (
          <>
            {/* ---------------- TABLE ---------------- */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left">Nom du client</th>
                    <th className="px-6 py-4 text-left">
                      Identifiant du rapport
                    </th>
                    <th className="px-6 py-4 text-left">Date de création</th>
                    <th className="px-6 py-4 text-left">Télécharger</th>
                    <th className="px-6 py-4 text-left">Report Status</th>
                    <th className="px-6 py-4 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading
                    ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <SkeletonRow key={i} />
                      ))
                    : paginatedData.map((row) => {
                        const ui = STATUS_UI[row.status] || STATUS_UI.New;

                        return (
                          <tr key={row.id}>
                            <td className="px-6 py-3">{row.customerName}</td>
                            <td className="px-6 py-3 text-blue-600">
                              {row.reportId}
                            </td>
                            <td className="px-6 py-3">
                              {row.date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              })}
                            </td>

                            <td className="px-6 py-3">
                              {isDownloadAllowed(row.type) ? (
                                <button
                                  onClick={() => handleDownload(row)}
                                  disabled={downloadingId === row.id}
                                  className="flex items-center gap-2 px-4 py-1 border rounded-full disabled:opacity-50"
                                >
                                  <FaDownload />
                                  {downloadingId === row.id
                                    ? "Télécharger..."
                                    : "Télécharger"}
                                </button>
                              ) : (
                                <span className="px-5 py-1.5 border rounded-full text-gray-400 cursor-not-allowed">
                                  Indisponible
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-3">
                              {(() => {
                                const reportType =
                                  REPORT_TYPE_UI[row.type] ||
                                  REPORT_TYPE_UI.draft;

                                return (
                                  <span
                                    className={`px-4 py-1 rounded-full text-xs font-medium ${reportType.pill}`}
                                  >
                                    {reportType.label}
                                  </span>
                                );
                              })()}
                            </td>

                            <td className="px-6 py-3">
                              <button
                                onClick={() =>
                                  navigate(`/user/report-detail/${row.id}`)
                                }
                              >
                                <IoIosArrowForward />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>

            {/* ---------------- PAGINATION ---------------- */}
            <div className="flex justify-center items-center gap-2 mt-6 text-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 disabled:text-gray-400"
              >
                ← Précédent
              </button>

              {getPages().map((p, i) =>
                p === "…" ? (
                  <span key={i} className="px-2">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded ${
                      page === p ? "bg-black text-white" : "hover:bg-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 disabled:text-gray-400"
              >
                suivant →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
