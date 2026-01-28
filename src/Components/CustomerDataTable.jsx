import { useState, useMemo, useEffect, useRef } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { RxEnvelopeOpen } from "react-icons/rx";
import { CiPaperplane } from "react-icons/ci";
import { IoFilterOutline } from "react-icons/io5";
import { LuArrowDownUp } from "react-icons/lu";
import { IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@mui/material";
import { toast } from "react-toastify";

const UsersTableSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-2xl mt-8 p-2 overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          {Array.from({ length: 7 }).map((_, i) => (
            <th key={i} className="p-4">
              <Skeleton variant="text" width={100} />
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: 9 }).map((_, row) => (
          <tr key={row}>
            {Array.from({ length: 7 }).map((_, col) => (
              <td key={col} className="p-4">
                {col === 6 ? (
                  <Skeleton variant="circular" width={20} height={20} />
                ) : (
                  <Skeleton variant="text" width="80%" />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PAGE_SIZE = 9;

const FILTER_LABELS = {
  All: "Tous",
  Active: "Actif",
  Inactive: "Inactif",
  Blocked: "Bloqué",
};

const SORT_LABELS = {
  "name-asc": "Nom (A–Z)",
  "date-desc": "Les plus récents",
};

export default function CustomersTable() {
  const [users, setUsers] = useState([]); // ← API DATA
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filterRef = useRef(null);
  const sortRef = useRef(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

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

  // invite user
const handleSendInvite = async () => {
  if (!inviteEmail.trim()) {
    toast.warning("Veuillez saisir une adresse e-mail");
    return;
  }

  try {
    setInviteLoading(true);

    const res = await axios.post(
      "https://api.emibocquillon.fr/admin/invite/invite-user",
      { Email: inviteEmail.trim() },
      authConfig,
    );

    // SUCCESS RESPONSE
    if (res.data?.success) {
      toast.success(res.data?.message || "Invitation envoyée avec succès");
      setInviteEmail("");
    } 
    // API responded but success === false
    else {
      toast.error(res.data?.message || "Échec de l’envoi de l’invitation");
    }
  } catch (error) {
    console.error("Invite user failed:", error);

    if (handleAuthError(error)) return;

    toast.error(
      error.response?.data?.message ||
      "Une erreur s’est produite lors de l’envoi de l’invitation",
    );
  } finally {
    setInviteLoading(false);
  }
};


  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      month: "short", // Jan
      day: "2-digit", // 22
      year: "numeric", // 2026
    });
  };

  /* ----------------------------------
     FETCH USERS FROM API
  -----------------------------------*/
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // const token = localStorage.getItem("token"); // or wherever stored

        const res = await axios.get(
          "https://api.emibocquillon.fr/admin/users/all-users",
          authConfig,
        );

        // ✅ SAFELY extract array
        const usersArray = Array.isArray(res.data?.usersData)
          ? res.data.usersData
          : [];

        const normalized = usersArray.map((u) => ({
          id: u._id,
          username: u.userName || "—",
          email: u.Email || "—",
          phone: u.PhoneNumber || "—",

          date: formatDate(u.createdAt),

          role: u.role || "user",
          status:
            u.isActive === "active"
              ? "Active"
              : u.isActive === "blocked"
                ? "Blocked"
                : "Inactive",
        }));

        setUsers(normalized);
      } catch (err) {
        console.error("Fetch users error:", err);

        if (handleAuthError(err)) return;

        setError(
          err.response?.data?.message || "Échec du chargement des utilisateurs",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => setPage(1), [tab, query, statusFilter, sortBy]);

  const ROLE_LABELS = {
    permium_user: "Utilisateur Premium",
    invited: "Invités",
    user: "Utilisatrice",
  };

  const STATUS_LABELS = {
    Active: "Actif",
    Inactive: "Inactif",
    Blocked: "Bloqué",
  };

  const getRoleLabel = (role) => ROLE_LABELS[role] || role;
  const getStatusLabel = (status) => STATUS_LABELS[status] || status;

  /* ----------------------------------
     FILTERING & SORTING (UNCHANGED)
  -----------------------------------*/
  const filtered = useMemo(() => {
    let data = [...users];

    if (tab === "Invited") {
      data = data.filter((u) => u.role === "invited");
    }

    if (query) {
      const q = query.toLowerCase();
      data = data.filter((u) =>
        `${u.username} ${u.email} ${u.id}`.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "All") {
      data = data.filter((u) => u.status === statusFilter);
    }

    if (sortBy === "name-asc") {
      data.sort((a, b) => a.username.localeCompare(b.username));
    }

    if (sortBy === "date-desc") {
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return data;
  }, [users, tab, query, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ----------------------------------
     RENDER
  -----------------------------------*/
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Top Controls stay visible */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Skeleton variant="rectangular" width={140} height={42} />
          <Skeleton variant="rectangular" width={320} height={42} />
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Skeleton variant="rectangular" width="100%" height={48} />
          <Skeleton variant="rectangular" width={140} height={48} />
          <Skeleton variant="rectangular" width={140} height={48} />
        </div>

        <UsersTableSkeleton />

        {/* Pagination Skeleton */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={36}
              height={36}
              sx={{ borderRadius: 8 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* TOP CONTROLS — unchanged UI */}
      {/* Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("All")}
            className={`px-4 py-2 rounded-lg border border-gray-400 ${
              tab === "All" ? "bg-green-700 text-white" : "bg-white"
            }`}
          >
            <FiUsers className="inline mr-2 mb-1" size={21} />
            Tous
          </button>
          <button
            onClick={() => setTab("Invited")}
            className={`px-4 py-2 rounded-lg border border-gray-400 ${
              tab === "Invited" ? "bg-green-700 text-white" : "bg-white"
            }`}
          >
            <RxEnvelopeOpen className="inline mr-2" size={20} />
            Invités
          </button>
        </div>

        {/* send invitation */}
        <div className="flex gap-2 w-full md:w-auto">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Saisir un email pour envoyer une invitation "
            type="email"
            className="border border-gray-400 rounded-lg px-4 py-2 w-full md:w-80"
          />

          <button
            onClick={handleSendInvite}
            disabled={inviteLoading}
            className={`bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1
      ${inviteLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-green-800"}
    `}
          >
            <CiPaperplane size={22} />
            {inviteLoading ? "Envoi..." : "Envoyer l’invitation "}
          </button>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, email ou ID"
            className="pl-10 pr-4 py-3 placeholder-gray-400 w-full border border-gray-400 rounded-lg bg-white"
          />
        </div>

        {/* Filter */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => {
              setIsFilterOpen((p) => !p);
              setIsSortOpen(false);
            }}
            className={`flex items-center gap-2 px-4 py-3 border border-gray-400 rounded-lg bg-white hover:bg-gray-50 ${
              statusFilter !== "All" ? "border-gray-400" : ""
            }`}
          >
            <IoFilterOutline className="text-gray-500" size={22} />
            <span className="text-sm font-medium">
              {statusFilter === "All" ? "Filtrer" : FILTER_LABELS[statusFilter]}
            </span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 p-3 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
              {["All", "Active", "Inactive", "Blocked"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    statusFilter === status ? "bg-gray-50 font-medium" : ""
                  }`}
                >
                  {FILTER_LABELS[status]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => {
              setIsSortOpen((p) => !p);
              setIsFilterOpen(false);
            }}
            className={`flex items-center gap-2 px-4 py-3 border border-gray-400 rounded-lg bg-white hover:bg-gray-50 ${
              sortBy ? "border-gray-300" : ""
            }`}
          >
            <LuArrowDownUp className="text-gray-400" size={20} />
            <span className="text-sm font-medium">
              {sortBy ? SORT_LABELS[sortBy] : "Trier"}
            </span>
          </button>

          {isSortOpen && (
            <div className="absolute right-0 mt-2 p-3 w-44 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
              <button
                onClick={() => {
                  setSortBy("name-asc");
                  setIsSortOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  sortBy === "name-asc" ? "bg-gray-50 font-medium" : ""
                }`}
              >
                Nom d’utilisateur (A–Z)
              </button>

              <button
                onClick={() => {
                  setSortBy("date-desc");
                  setIsSortOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  sortBy === "date-desc" ? "bg-gray-50 font-medium" : ""
                }`}
              >
                Date d’inscription
              </button>

              <button
                onClick={() => {
                  setSortBy(null);
                  setIsSortOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Réinitialiser le tri
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl mt-8 p-2 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[#616F89]">
            <tr>
              <th className="p-4 text-left">Nom d’utilisateur </th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Numéro de téléphone </th>
              <th className="p-4 text-left">Date d’inscription</th>
              <th className="p-4 text-left">Rôle</th>
              <th className="p-4 text-left">Statut</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u) => (
              <tr key={u.id}>
                <td className="p-4">{u.username}</td>
                <td className="p-4 text-blue-600">{u.email}</td>
                <td className="p-4">{u.phone}</td>
                <td className="p-4">{u.date}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      u.role === "permium_user"
                        ? "bg-purple-100 px-2 py-2 text-purple-700"
                        : u.role === "invited"
                          ? "bg-blue-100 px-8 text-blue-700"
                          : "bg-gray-100 px-9 text-gray-700"
                    }`}
                  >
                    {getRoleLabel(u.role)}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      u.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : u.status === "Blocked"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {getStatusLabel(u.status)}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    onClick={() => navigate(`/user/customer-detail/${u.id}`)}
                  >
                    <IoIosArrowForward />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-8">
        {/* Previous */}
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 h-9 rounded-lg border border-gray-300 bg-white disabled:opacity-40"
        >
          <span>‹</span>
          <span className="text-sm font-medium">Précédent</span>
        </button>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
          .map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${
                p === page
                  ? "bg-black text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}

        {/* Next */}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 px-3 h-9 rounded-lg border border-gray-300 bg-white disabled:opacity-40"
        >
          <span className="text-sm font-medium">suivant</span>
          <span>›</span>
        </button>
      </div>
    </div>
  );
}
