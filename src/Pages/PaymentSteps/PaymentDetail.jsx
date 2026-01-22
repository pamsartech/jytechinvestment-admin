import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaCreditCard,
  FaHashtag,
  FaInfoCircle,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import Navbar from "../../Components/Navbar";
import Skeleton from "@mui/material/Skeleton";

const PaymentDetailsSkeleton = () => {
  return (
    <div>
      <Navbar heading="Gestion des paiements" />

      <div className="p-6 mt-5 bg-gray-50 min-h-screen">
        {/* Back */}
        <div className="mb-4">
          <Skeleton width={180} height={22} />
        </div>

        {/* Title */}
        <Skeleton width={260} height={32} className="mb-6" />

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm max-w-6xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-300">
            <Skeleton width={220} height={22} />
            <Skeleton width={360} height={16} className="mt-1" />
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Column */}
            <div className="p-6 border-r border-gray-300 space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton width={180} height={16} className="mb-2" />
                  <Skeleton width="70%" height={22} />
                  {i === 0 && (
                    <Skeleton width="50%" height={16} className="mt-1" />
                  )}
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="p-6 space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton width={200} height={16} className="mb-2" />
                  <Skeleton width="80%" height={22} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function PaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [payment, setPayment] = useState(null);
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  /* ---------------- FETCH PAYMENT DETAILS ---------------- */
  useEffect(() => {
    fetchPaymentDetails();
  }, [id]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `https://api.emibocquillon.fr/admin/payments/${id}`,
        authConfig,
      );

      setPayment(res.data.paymentDetails);
      setUser(res.data.userDetails);
    } catch (err) {
      console.error(err);
      setError("Failed to load payment details.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOADING / ERROR ---------------- */
 if (loading) {
  return <PaymentDetailsSkeleton />;
}


  if (error) {
    return (
      <div>
        <Navbar heading="Payment Management" />
        <div className="p-6 text-center text-red-500">{error}</div>
      </div>
    );
  }

  /* ---------------- STATUS UI ---------------- */
  const isPaid =
    payment.paymentStatus?.toLowerCase() === "paid" ||
    payment.paymentStatus?.toLowerCase() === "succeeded";

  return (
    <div>
      <Navbar heading="Gestion des paiements" />

      <div className="p-6 mt-5 bg-gray-50 min-h-screen">
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 mb-4"
        >
          <FaArrowLeft />
          Back to Payments
        </button>

        <h1 className="text-xl font-semibold mb-6">Détails du paiement</h1>

        {/* CARD */}
        <div className="bg-white rounded-xl shadow-sm max-w-6xl">
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-b-gray-300">
            <h2 className="font-medium">informations générales</h2>
            <p className="text-sm text-gray-500">
              Informations de base concernant le rapport de propriété généré.
            </p>
          </div>

          {/* CONTENT */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* LEFT COLUMN */}
            <div className="p-6 border-r border-r-gray-300 space-y-6">
              {/* CUSTOMER */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaUser />
                  Nom du client
                </div>
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>

                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              </div>

              {/* AUTO PAY */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaInfoCircle />
                  Statut du paiement automatique
                </div>

                <span
                  className={`inline-flex items-center gap-2 px-4 py-1 text-xs rounded-full font-semibold
    ${
      typeof payment?.subscriptionStatus === "string" &&
      payment.subscriptionStatus.toLowerCase() === "active"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }
  `}
                >
                  <span
                    className={`w-2 h-2 rounded-full
      ${
        typeof payment?.subscriptionStatus === "string" &&
        payment.subscriptionStatus.toLowerCase() === "active"
          ? "bg-green-500"
          : "bg-red-500"
      }
    `}
                  />
                  {typeof payment?.subscriptionStatus === "string" &&
                  payment.subscriptionStatus.toLowerCase() === "active"
                    ? "Actif"
                    : "Inactif"}
                </span>
              </div>

              {/* SUBSCRIPTION */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaCalendarAlt />
                  Plan d'abonnement
                </div>

                <span className="inline-flex items-center gap-2 px-4 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  {payment.planName}
                </span>
              </div>

              {/* PAYMENT STATUS */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaInfoCircle />
                  Statut du paiement
                </div>

                {isPaid ? (
                  <span className="inline-flex items-center gap-2 px-4 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    <FaCheck />
                    Payé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                    <FaTimes />
                    En attente
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaEnvelope />
                  E-Mail
                </div>
                <span>{user.email}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaCalendarAlt />
                  Date
                </div>
                <span>
                  {new Date(payment.paymentDate).toLocaleString("en-US", {
                    month: "long",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaCreditCard />
                  Mode de paiement
                </div>
                <span>{payment.paymentMethod}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaHashtag />
                  Identifiant de transaction
                </div>
                <span className="break-all">{payment.paymentId}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaCreditCard />
                  Coût de l'abonnement
                </div>
                <span>
                  {/* € {payment.amount} ({subscription.interval}) */}€{" "}
                  {payment.amount} /{" "}
                  {payment.planName.includes("Yearly") ? "Year" : "Month"}
                </span>
              </div>

              {payment.discount > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FaInfoCircle />
                    Rabais
                  </div>
                  <span>€ {payment.discount}</span>
                </div>
              )}

              {payment.promoCode && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FaInfoCircle />
                    Code promotionnel
                  </div>
                  <span>{payment.promoCode}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
