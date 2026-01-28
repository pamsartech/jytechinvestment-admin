import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaDownload,
  FaTrash,
  FaBan,
  FaUser,
  FaCalendarAlt,
  FaHashtag,
  FaFileAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import { toast } from "react-toastify";
import Skeleton from "@mui/material/Skeleton";


const REPORT_TYPE_UI = {
  purchase: {
    label: "Complété",
    pill: "bg-green-100 text-green-700",
    canDownload: true,
  },
  draft: {
    label: "Draft",
    pill: "bg-blue-100 px-7 text-blue-700",
    canDownload: false,
  },
  deleted: {
    label: "Supprimé",
    pill: "bg-gray-200 text-gray-600",
    canDownload: false,
  },
};

const ReportDetailSkeleton = () => {
  return (
    <div>
      <Navbar heading="Gestion des rapports" />

      <div className="min-h-screen bg-gray-50 p-6 mt-5">
        {/* Back Button */}
        <div className="mb-4">
          <Skeleton width={160} height={22} />
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Skeleton width={240} height={32} />

          <div className="flex gap-3">
            <Skeleton variant="rounded" width={140} height={36} />
            <Skeleton variant="rounded" width={180} height={36} />
          </div>
        </div>

        {/* General Info Card */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-300">
            <Skeleton width={220} height={22} />
            <Skeleton width={360} height={16} className="mt-1" />
          </div>

          <div className="grid md:grid-cols-2">
            {/* Left */}
            <div className="p-6 border-r border-gray-300 space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i}>
                  <Skeleton width={180} height={16} className="mb-2" />
                  <Skeleton width="80%" height={22} />
                </div>
              ))}
            </div>

            {/* Right */}
            <div className="p-6 space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i}>
                  <Skeleton width={180} height={16} className="mb-2" />
                  <Skeleton width="60%" height={22} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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


  /* ---------------- FETCH PROJECT ---------------- */
  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `https://api.emibocquillon.fr/admin/projects/${id}`,
        authConfig
      );

      setProject(res.data.project);
    } catch (err) {
  console.error(err);

  if (handleAuthError(err)) return;

  setError("Failed to load report details.");
}
 finally {
      setLoading(false);
    }
  };

  const getReportTypeUI = (type) =>
    REPORT_TYPE_UI[type] || REPORT_TYPE_UI.draft;

 

const showConfirmToast = (message) => {
  return new Promise((resolve) => {
    const toastId = toast(
      () => (
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
      }
    );
  });
};

 /* ---------------- DOWNLOAD ---------------- */
const handleDownload = async () => {
  if (!project || project.type !== "purchase") {
    toast.info("Ce rapport n’est pas disponible au téléchargement.");
    return;
  }

  const loadingToast = toast.loading("Préparation du téléchargement...");

  try {
    setDownloading(true);

    const response = await axios.get(
      `https://api.emibocquillon.fr/admin/projects/generate-report/${id}`,
      {
        ...authConfig,
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${id}.pdf`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.update(loadingToast, {
      render: "Téléchargement terminé avec succès",
      type: "success",
      isLoading: false,
      autoClose: 3000,
    });
  } catch (err) {
  console.error(err);

  if (handleAuthError(err)) {
    toast.dismiss(loadingToast);
    return;
  }

  toast.update(loadingToast, {
    render:
      err.response?.data?.message ||
      "Échec du téléchargement du rapport",
    type: "error",
    isLoading: false,
    autoClose: 4000,
  });
}
 finally {
    setDownloading(false);
  }
};




  // delete report
  const handleDeleteReport = async () => {
  const confirmed = await showConfirmToast(
    "Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible."
  );

  if (!confirmed) return;

  const loadingToast = toast.loading("Suppression du rapport...");

  try {
    setDeleting(true);

    const res = await axios.post(
      `https://api.emibocquillon.fr/api/project/soft-delete/${id}`,
      {},
      authConfig
    );

    if (res.data?.success !== false) {
      toast.update(loadingToast, {
        render: "Rapport supprimé avec succès",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      navigate("/user/report");
    } else {
      toast.update(loadingToast, {
        render:
          res.data?.message || "Échec de la suppression du rapport",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  } catch (err) {
  console.error(err);

  if (handleAuthError(err)) {
    toast.dismiss(loadingToast);
    return;
  }

  toast.update(loadingToast, {
    render:
      err.response?.data?.message ||
      "Impossible de supprimer le rapport. Veuillez réessayer.",
    type: "error",
    isLoading: false,
    autoClose: 3000,
  });
}
 finally {
    setDeleting(false);
  }
};


  /* ---------------- STATES ---------------- */
if (loading) {
  return <ReportDetailSkeleton />;
}


  if (error) {
    return (
      <div>
        <Navbar heading="Gestion des rapports" />
        <div className="p-10 text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <Navbar heading="Gestion des rapports" />
        <div className="p-10 text-center text-gray-500">No data found.</div>
      </div>
    );
  }

  const customerName = `${project.userId?.FirstName || ""} ${
    project.userId?.LastName || ""
  }`;
  const createdDate = new Date(project.createdAt);

  return (
    <div>
      <Navbar heading="Gestion des rapports" />

      <div className="min-h-screen bg-gray-50 p-6 mt-5">
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 mb-4"
        >
          <FaArrowLeft />
         Retour à la liste des rapports
        </button>

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-semibold">Détails du rapport</h1>

          <div className="flex gap-3">
            {(() => {
              const typeUI = getReportTypeUI(project.type);

              return (
                <ActionButton
                  icon={<FaDownload />}
                  label={
                    downloading
                      ? "Télécharger..."
                      : typeUI.canDownload
                      ? "Télécharger"
                      : "Indisponible"
                  }
                  className={
                    typeUI.canDownload
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }
                  onClick={handleDownload}
                  disabled={downloading || !typeUI.canDownload}
                />
              );
            })()}

            <ActionButton
              icon={<FaTrash />}
              label={deleting ? "Deleting..." : "Supprimer Rapport"}
              className="bg-red-200 text-red-700"
              onClick={handleDeleteReport}
              disabled={deleting}
            />
          </div>
        </div>

        {/* GENERAL INFORMATION */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-300">
            <h2 className="font-medium">informations générales</h2>
            <p className="text-sm text-gray-500">
              Informations de base concernant le rapport de propriété généré.
            </p>
          </div>

          <div className="grid md:grid-cols-2">
            {/* LEFT */}
            <div className="p-6 border-r border-gray-300 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaHashtag />
                  Identifiant du rapport
                </div>
                <p className="font-medium">{project._id}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaCalendarAlt />
                  Date de création
                </div>
                <p className="font-medium">
                  {createdDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  at{" "}
                  {createdDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaUser />
                  Nom du client
                </div>
                <p className="font-medium">{customerName || "N/A"}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaInfoCircle />
                  Report Status
                </div>

                {(() => {
                  const typeUI = getReportTypeUI(project.type);

                  return (
                    <span
                      className={`inline-flex items-center px-4 py-1 text-xs rounded-full font-medium ${typeUI.pill}`}
                    >
                      {typeUI.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* SIMULATIONS (Placeholder until backend provides them) */}
        {/* <div className="bg-white rounded-xl shadow-sm p-6 text-gray-500 text-sm text-center">
          No simulations available for this report yet.
        </div> */}
      </div>
    </div>
  );
}

/* ---------------- ACTION BUTTON ---------------- */

function ActionButton({ icon, label, className, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full disabled:opacity-50 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
