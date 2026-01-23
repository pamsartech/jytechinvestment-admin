import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaBan } from "react-icons/fa";
import { toast } from "react-toastify";
import Skeleton from "@mui/material/Skeleton";

const USER_STATUS_UI = {
  active: {
    label: "Utilisateur Actif",
    pill: "bg-green-100 text-green-700",
  },
  blocked: {
    label: "Utilisateur Bloqué",
    pill: "bg-red-100 text-red-700",
  },
};

const CustomerDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button */}
      <div className="mb-4">
        <Skeleton width={180} height={24} />
      </div>

      {/* Title */}
      <Skeleton width={280} height={32} className="mb-6" />

      {/* Overview + Actions */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Overview Card */}
        <div className="lg:col-span-2 bg-white border border-gray-300 rounded-xl shadow-sm">
          <div className="flex justify-between px-6 py-4 border-b border-gray-300">
            <Skeleton width={140} height={24} />
            <Skeleton variant="rounded" width={120} height={28} />
          </div>

          <div className="grid md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 space-y-2">
                <Skeleton width={140} height={16} />
                <Skeleton width="80%" height={22} />
              </div>
            ))}
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
          <Skeleton width={160} height={22} className="mb-2" />
          <Skeleton width="100%" height={16} className="mb-4" />
          <Skeleton variant="rounded" width={220} height={40} />
        </div>
      </div>

      {/* Subscription + Reports Count */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-300 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-300">
            <Skeleton width={220} height={22} />
          </div>

          <div className="grid md:grid-cols-4 p-6 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton width={120} height={16} />
                <Skeleton width="80%" height={22} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 flex flex-col items-center">
          <Skeleton width={200} height={20} className="mb-2" />
          <Skeleton width={80} height={40} className="mb-2" />
          <Skeleton width={120} height={16} />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm mt-10">
        <div className="px-6 py-4 border-b border-gray-300">
          <Skeleton width={240} height={22} />
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(3)].map((_, i) => (
                <th key={i} className="p-6">
                  <Skeleton width={140} height={18} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, rowIdx) => (
              <tr key={rowIdx}>
                {[...Array(3)].map((_, colIdx) => (
                  <td key={colIdx} className="p-6">
                    <Skeleton variant="rectangular" height={20} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [blockLoading, setBlockLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const userStatus = isBlocked ? "blocked" : "active";
  const userStatusUI = USER_STATUS_UI[userStatus];

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

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `https://api.emibocquillon.fr/admin/users/${id}`,
          authConfig,
        );

        const { user, projectReports } = res.data;

        setIsBlocked(user.isActive === "blocked");

        /* -------- Customer -------- */
        setCustomer({
          name: `${user.FirstName || ""} ${user.LastName || ""}`.trim(),
          email: user.Email || "—",
          phone: user.PhoneNumber || "—",
          plan_name: user.plan_name || "-",
          lastLogin: user.updatedAt
            ? new Date(user.updatedAt).toLocaleString()
            : "—",
        });

        /* -------- Subscription -------- */
        const start = user.startDate ? new Date(user.startDate) : null;
        const end = user.endDate ? new Date(user.endDate) : null;

        const daysRemaining =
          start && end
            ? Math.max(
                0,
                Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
              )
            : 0;

        setSubscription({
          start: start ? start.toDateString() : "—",
          end: end ? end.toDateString() : "—",
          daysRemaining,
        });

        /* -------- Reports -------- */
        const normalizedReports = Array.isArray(projectReports)
          ? projectReports.map((r) => ({
              id: r._id,
              date: r.createdAt ? new Date(r.createdAt).toDateString() : "—",
              type: r.type || "draft", // keep backend value
            }))
          : [];

        setReports(normalizedReports);
        setReportsCount(normalizedReports.length);
      } catch (err) {
        console.error("Failed to load customer detail", err);

        if (handleAuthError(err)) return;
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetail();
  }, [id]);

  if (loading) {
    return <CustomerDetailSkeleton />;
  }

  if (!customer) {
    return <div className="p-6 text-red-500">Customer not found</div>;
  }

  const REPORT_TYPE_TO_STATUS = {
    draft: "Brouillon",
    purchase: "Complète",
    deleted: "Supprimé",
  };

  const statusStyles = {
    Complète: "bg-green-100 px-6 text-green-700",
    Brouillon: "bg-blue-100 px-6 text-blue-700",
    Supprimé: "bg-gray-200 px-4 text-gray-600",
  };

  const handleBlockUser = async () => {
    const confirmBlock = window.confirm(
      "Are you sure you want to block this user? This will immediately revoke their access.",
    );

    if (!confirmBlock) return;

    try {
      setBlockLoading(true);

      const res = await axios.put(
        `https://api.emibocquillon.fr/admin/users/block/${id}`,
        {}, // 👈 no body
        authConfig, // 👈 headers go here
      );

      if (res.data.success) {
        alert("User has been blocked successfully");
        // toast.success("User has been blocked successfully");
        setIsBlocked(true);
      } else {
        toast.error("Failed to block user");
      }
    } catch (error) {
      console.error("Block user failed", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to block user. Please try again.",
      );
    } finally {
      setBlockLoading(false);
    }
  };

  const showConfirmToast = (message) => {
    return new Promise((resolve) => {
      const toastId = toast(
        ({ closeToast }) => (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-800">{message}</p>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100"
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(false);
                }}
              >
                Annuler
              </button>

              <button
                className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(true);
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        ),
        {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          position: "bottom-right",
        },
      );
    });
  };

  const handleToggleUserStatus = async () => {
    const actionLabel = isBlocked ? "débloquer" : "bloquer";

    const confirmed = await showConfirmToast(
      `Êtes-vous sûr de vouloir ${actionLabel} cet utilisateur ?`,
    );

    if (!confirmed) return;

    const loadingToast = toast.loading(
      `${actionLabel === "bloquer" ? "Blocage" : "Déblocage"} en cours...`,
    );

    try {
      setBlockLoading(true);

      const res = await axios.put(
        `https://api.emibocquillon.fr/admin/users/block/${id}`,
        {},
        authConfig,
      );

      if (res.data?.success) {
        toast.update(loadingToast, {
          render:
            actionLabel === "bloquer"
              ? "Utilisateur bloqué avec succès"
              : "Utilisateur débloqué avec succès",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setIsBlocked((prev) => !prev);
      } else {
        toast.update(loadingToast, {
          render:
            res.data?.message ||
            `Échec lors du ${actionLabel} de l'utilisateur`,
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error(`${actionLabel} user failed`, error);

      if (handleAuthError(error)) {
        toast.dismiss(loadingToast);
        return;
      }

      toast.update(loadingToast, {
        render:
          error.response?.data?.message ||
          `Impossible de ${actionLabel} l'utilisateur. Veuillez réessayer.`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setBlockLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 mb-4"
      >
        <FaArrowLeft />
        Retour à la liste des clients
      </button>

      <h1 className="text-xl font-semibold mb-6">Gestion de la clientèle</h1>

      {/* CUSTOMER OVERVIEW */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-300 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-b-gray-300">
            <h2 className="font-medium">Aperçu client</h2>

            <span
              className={`text-xs font-medium px-4 py-1 rounded-full ${userStatusUI.pill}`}
            >
              {userStatusUI.label}
            </span>
          </div>

          <div className="grid md:grid-cols-2">
            <div className="p-6 border-r border-r-gray-300 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nom et prénom</p>
                <p className="font-medium">{customer.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Date de la dernière connexion
                </p>
                <p className="font-medium">{customer.lastLogin}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Adresse email</p>
                <p className="font-medium">{customer.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Numéro de téléphone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
          <h2 className="font-medium mb-2">Actions du compte</h2>
          <p className="text-sm text-gray-500 mb-4">
            Gérez l'accès de ce client. Le blocage révoquera immédiatement son
            accès à la plateforme.
          </p>

          {isBlocked ? (
            /* -------- UNBLOCK BUTTON -------- */
            <button
              onClick={handleToggleUserStatus}
              disabled={blockLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm border
      bg-green-100 text-green-700 border-green-400 hover:bg-green-200
      disabled:opacity-50"
            >
              <FaBan />
              {blockLoading ? "Unblocking..." : "Débloquer Utilisateur"}
            </button>
          ) : (
            /* -------- BLOCK BUTTON -------- */
            <button
              onClick={handleToggleUserStatus}
              disabled={blockLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm border
      bg-red-100 text-red-600 border-red-400 hover:bg-red-200
      disabled:opacity-50"
            >
              <FaBan />
              {blockLoading ? "Blocking..." : "Bloquer Utilisateur"}
            </button>
          )}
        </div>
      </div>

      {/* SUBSCRIPTION + REPORT COUNT */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-300 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-b-gray-300">
            <h2 className="font-medium">Informations sur l'abonnement</h2>
          </div>

          <div className="grid md:grid-cols-4 p-6 gap-6">
            <div>
              <p className="text-sm text-gray-500">Nom du plan</p>
              <p className="font-medium">{customer.plan_name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date de début</p>
              <p className="font-medium">{subscription.start}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date de fin</p>
              <p className="font-medium">{subscription.end}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Jours restants</p>
              <p className="font-medium text-blue-600">
                {subscription.daysRemaining} jours restants
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
          <h2 className="font-medium mb-2">Nombre total de rapports générés</h2>
          <p className="text-3xl font-semibold text-blue-600">{reportsCount}</p>
          <p className="text-sm text-gray-500">Activité à vie</p>
        </div>
      </div>

      {/* REPORT LIST */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm mt-10">
        <div className="px-6 py-4 border-b border-b-gray-300">
          <h2 className="font-medium">Liste des rapports d'utilisateurs</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr className="">
              <th className="p-6 text-left">Identifiant du rapport</th>
              <th className="p-6 text-left">Créé</th>
              <th className="p-6 text-left">Statut</th>
            </tr>
          </thead>
          <tbody className="">
            {reports.map((r) => {
              const label = REPORT_TYPE_TO_STATUS[r.type] || "Inconnu";

              return (
                <tr key={r.id}>
                  <td className="p-4 px-6 font-medium">{r.id}</td>
                  <td className="p-4 px-6">{r.date}</td>
                  <td className="p-4 px-6">
                    <span
                      className={`rounded-full text-xs py-1 ${
                        statusStyles[label]
                      }`}
                    >
                      {label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
