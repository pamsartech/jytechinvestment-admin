import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  FaSearch,
  FaCheck,
  FaExclamation,
  FaUndo,
  FaClock,
} from "react-icons/fa";
import { IoFilterOutline } from "react-icons/io5";
import { LuArrowDownUp } from "react-icons/lu";
import { IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Skeleton from "@mui/material/Skeleton";
import { toast } from "react-toastify";

const TableSkeleton = ({ rows = 9 }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm table-auto">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: 8 }).map((_, i) => (
              <th key={i} className="px-6 py-4">
                <Skeleton variant="text" width={80} height={20} />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {Array.from({ length: 8 }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton variant="rectangular" height={20} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------------- CONFIG ---------------- */
const PAGE_SIZE = 9;

/* ---------------- STATUS UI ---------------- */
const STATUS_UI = {
  Paid: {
    label: "Payé",
    class: "bg-green-100 text-green-700",
    icon: <FaCheck />,
  },
  Pending: {
    label: "En attente",
    class: "bg-yellow-100 text-yellow-700",
    icon: <FaClock />,
  },
  Failed: {
    label: "Échoué",
    class: "bg-red-100 text-red-600",
    icon: <FaExclamation />,
  },
  // Refunded: {
  //   label: "Refunded",
  //   class: "bg-blue-100 text-blue-600",
  //   icon: <FaUndo />,
  // },
};

const SUBSCRIPTION_UI = {
  Active: {
    label: "Actif",
    class: "bg-green-100 text-green-700",
    icon: <FaCheck />,
  },
  Inactive: {
    label: "Inactif",
    class: "bg-red-100 text-red-600",
    icon: <FaExclamation />,
  },
};

/* ---------------- FILTER + SORT LABELS (FR) ---------------- */

const FILTER_STATUS_LABELS = {
  All: "Tous",
  Paid: "Payé",
  Pending: "En attente",
  Failed: "Échoué",
  Refunded: "Remboursé",
};

const SORT_LABELS = {
  "date-desc": "Date (plus récents)",
  "date-asc": "Date (plus anciens)",
  "amount-desc": "Montant (élevé → faible)",
  "amount-asc": "Montant (faible → élevé)",
};

export default function Payments() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("date-desc");
  const [page, setPage] = useState(1);

  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    if (!token) {
      toast.error("Votre session a expiré. Veuillez vous reconnecter.");
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const handleAuthError = (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      toast.error("Session expirée. Veuillez vous reconnecter.");
      navigate("/login", { replace: true });
      return true;
    }

    return false;
  };

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        "https://api.emibocquillon.fr/admin/payments/all",
        authConfig,
      );

      const mapped = res.data.map((p) => {
        // Normalize payment status
        let status = "Pending";
        if (
          p.paymentStatus?.toLowerCase() === "paid" ||
          p.paymentStatus?.toLowerCase() === "succeeded"
        ) {
          status = "Paid";
        } else if (p.paymentStatus?.toLowerCase() === "failed") {
          status = "Failed";
        }

        // Normalize subscription status
        let subscriptionStatus = "Inactive";
        if (p.subscriptionStatus?.toLowerCase() === "active") {
          subscriptionStatus = "Active";
        }

        return {
          id: p._id,
          amount: p.amount,
          status: status,
          subscriptionStatus: subscriptionStatus, // ✅ THIS WAS MISSING
          email: p.userId?.Email || "N/A",
          transactionId: p.paymentId,
          date: new Date(p.paymentDate),
          method: p.paymentMethod || "Stripe",
        };
      });

      setRows(mapped);
    } catch (err) {
      console.error(err);

      if (handleAuthError(err)) return;

      setError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER + SORT ---------------- */
  const filtered = useMemo(() => {
    let data = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          r.transactionId.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "All") {
      data = data.filter((r) => r.status === statusFilter);
    }

    data.sort((a, b) => {
      if (sort === "date-desc") return b.date - a.date;
      if (sort === "date-asc") return a.date - b.date;
      if (sort === "amount-desc") return b.amount - a.amount;
      if (sort === "amount-asc") return a.amount - b.amount;
      return 0;
    });

    return data;
  }, [rows, search, statusFilter, sort]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <div>
      <Navbar heading="Gestion des paiements " />

      <div className="p-6 mt-5 bg-gray-50 min-h-screen">
        {/* TOP BAR */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par email "
              className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg text-sm"
            />
          </div>

          {/* FILTER */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2"
            >
              <IoFilterOutline className="text-gray-500" size={22} />
              {statusFilter === "All"
                ? "Filtrer"
                : FILTER_STATUS_LABELS[statusFilter]}
            </button>

            {showFilter && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow w-44 z-10">
                {["All", "Paid", "Pending", "Failed", "Refunded"].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setShowFilter(false);
                      setPage(1);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      statusFilter === s ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    {FILTER_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SORT */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2"
            >
              <LuArrowDownUp className="text-gray-400" size={20} />
              {SORT_LABELS[sort] || "Trier"}
            </button>

            {showSort && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow w-52 z-10">
                {["date-desc", "date-asc", "amount-desc", "amount-asc"].map(
                  (v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setSort(v);
                        setShowSort(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sort === v ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      {SORT_LABELS[v]}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* STATES */}
        {loading && <TableSkeleton rows={PAGE_SIZE} />}

        {error && <div className="text-center py-10 text-red-500">{error}</div>}

        {/* TABLE */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left">Montant</th>
                  <th className="px-6 py-4 text-center">Statut </th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 w-42 text-left">
                    ID de transaction
                  </th>
                  <th className="px-6 py-4 w-46 text-left">
                    Subscription Status
                  </th>
                  <th className="px-6 py-4 w-36 text-center">Date</th>
                  <th className="px-3 py-4 w-40 text-left">
                    Moyen de paiement{" "}
                  </th>
                  <th className="px-6 py-4 w-2 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((row) => {
                  const ui = STATUS_UI[row.status] || STATUS_UI.Pending;

                  return (
                    <tr key={row.id} className="border-t">
                      <td className="px-6 py-4">€ {row.amount}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs w-22 justify-center ${ui.class}`}
                        >
                          {/* {ui.icon} */}
                          {ui.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">{row.email}</td>
                      <td className="px-6 py-4 text-gray-600 text-center">
                        {row.id}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                          const ui =
                            SUBSCRIPTION_UI[row.subscriptionStatus] ||
                            SUBSCRIPTION_UI.Inactive;

                          return (
                            <span
                              className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs w-20 justify-center ${ui.class}`}
                            >
                              {/* {ui.icon} */}
                              {ui.label}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {row.date.toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          // hour: "numeric",
                          // minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-center">
                        {row.method}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            navigate(`/user/payment-detail/${row.id}`)
                          }
                        >
                          <IoIosArrowForward />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 text-sm select-none">
            {/* PREVIOUS */}
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={`px-4 py-2 rounded-lg border ${
                page === 1
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "border-gray-400 hover:bg-gray-100"
              }`}
            >
              ‹ Précédent
            </button>

            {/* PAGE NUMBERS */}
            {getPageNumbers().map((p, index) =>
              p === "..." ? (
                <span key={index} className="px-3 py-2">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg border ${
                    page === p
                      ? "bg-black text-white border-black"
                      : "border-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            {/* NEXT */}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className={`px-4 py-2 rounded-lg border ${
                page === totalPages
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "border-gray-400 hover:bg-gray-100"
              }`}
            >
              Suivant ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
