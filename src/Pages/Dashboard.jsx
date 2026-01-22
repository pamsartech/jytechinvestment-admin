import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../Components/Navbar";
import { FiUsers, FiFileText } from "react-icons/fi";
import { LuUserRoundCheck, LuUserRoundX } from "react-icons/lu";
import { Skeleton } from "@mui/material";

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="p-5 rounded-2xl shadow-md bg-white space-y-4"
      >
        <div className="flex justify-between">
          <Skeleton variant="text" width={140} />
          <Skeleton variant="circular" width={24} height={24} />
        </div>
        <Skeleton variant="text" width={80} height={32} />
      </div>
    ))}
  </div>
);


const SubscriptionRowsSkeleton = () => (
  <div className="space-y-4 mt-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="grid grid-cols-4 items-center px-5 gap-4">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton
          variant="rectangular"
          width={90}
          height={24}
          sx={{ borderRadius: 12 }}
        />
        <Skeleton variant="text" width="50%" sx={{ ml: "auto" }} />
      </div>
    ))}
  </div>
);

const ActivitySkeleton = () => (
  <div className="space-y-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex items-start justify-between"
      >
        <div className="flex gap-3">
          <Skeleton variant="circular" width={36} height={36} />
          <div className="space-y-2">
            <Skeleton variant="text" width={120} />
            <Skeleton variant="text" width={180} />
            <Skeleton
              variant="rectangular"
              width={80}
              height={18}
              sx={{ borderRadius: 12 }}
            />
          </div>
        </div>
        <Skeleton variant="text" width={50} />
      </div>
    ))}
  </div>
);


function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    projectsCreatedToday: 0,
  });

  const [recentSubscriptions, setRecentSubscriptions] = useState([]);
const [recentActivities, setRecentActivities] = useState([]);
const [recentLoading, setRecentLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ✅ API Endpoints
  const endpoints = {
    totalUsers: "https://api.emibocquillon.fr/admin/dashBoard/total-users",
    activeUsers: "https://api.emibocquillon.fr/admin/dashBoard/active-users",
    inactiveUsers: "https://api.emibocquillon.fr/admin/dashBoard/inactive-users",
    projectsCreatedToday: "https://api.emibocquillon.fr/admin/dashBoard/projects-created-today",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all APIs in parallel
        const [
          totalUsersRes,
          activeUsersRes,
          inactiveUsersRes,
          projectCreatedTodayRes,
        ] = await Promise.all([
          axios.get(endpoints.totalUsers, authConfig),
          axios.get(endpoints.activeUsers, authConfig),
          axios.get(endpoints.inactiveUsers, authConfig),
          axios.get(endpoints.projectsCreatedToday, authConfig),
        ]);

        setStats({
          totalUsers: totalUsersRes.data.totalUsers ?? 0,
          activeUsers: activeUsersRes.data.activeUsers ?? 0,
          inactiveUsers: inactiveUsersRes.data.inactiveUsers ?? 0,
          projectsCreatedToday: projectCreatedTodayRes.data.projectsCreatedToday ?? 0,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


// recent subscription and recent activity
  useEffect(() => {
  const fetchRecentData = async () => {
    try {
      setRecentLoading(true);

      const [subscriptionRes, activityRes] = await Promise.all([
        axios.get(
          "https://api.emibocquillon.fr/admin/dashBoard/latest-payments",
          authConfig
        ),
        axios.get(
          "https://api.emibocquillon.fr/admin/dashBoard/recent-activity",
          authConfig
        ),
      ]);

      setRecentSubscriptions(subscriptionRes.data?.latestPayments || []);
setRecentActivities(activityRes.data?.activities || []);
      showAlert("data loaded successfully!", "success");
    } catch (err) {
      console.error("Failed to load recent dashboard data", err);
    } finally {
      setRecentLoading(false);
    }
  };

  fetchRecentData();
}, []);


const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timeAgo = (isoDate) => {
  const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const activityBadge = (type) => {
  switch (type) {
    case "payment":
      return "bg-emerald-100 text-emerald-600";
    case "project":
      return "bg-indigo-100 text-indigo-600";
    case "user_update":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};


const formatAmount = (amount) =>
  `€ ${Number(amount || 0).toFixed(2)}`;

const planBadge = (plan) =>
  plan?.toLowerCase().includes("plus")
    ? "bg-emerald-100 text-emerald-600"
    : "bg-gray-100 text-gray-600";


 if (loading) {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar heading="Tableau de bord " />
      <StatsSkeleton />

      <div className="space-y-8 mt-5 pb-8">
        <div className="bg-white rounded-2xl p-6 mx-6">
          <Skeleton variant="text" width={220} height={28} />
          <SubscriptionRowsSkeleton />
        </div>

        <div className="bg-white rounded-2xl p-6 mx-6">
          <Skeleton variant="text" width={200} height={28} />
          <ActivitySkeleton />
        </div>
      </div>
    </div>
  );
}


  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navbar */}
      <Navbar heading="Tableau de bord " />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {/* Card 1 - Total Sales Today */}
        <div className="p-5 rounded-2xl shadow-md bg-[#719BEE]/20">
          <div className=" flex justify-between">
            <span className="text-gray-700">Utilisateurs totaux  </span>
            <span>
              {" "}
              <FiUsers className="inline-block text-[#719BEE]" size={20} />{" "}
            </span>
          </div>

          <p className="text-xl mt-7 font-medium">{stats.totalUsers}</p>
          {/* <p className="text-sm mt-7 text-gray-700">
            <span className="text-[#02B978]"> 4%</span>  depuis hier
          </p> */}
        </div>

        {/* Card 2 - Pending Orders */}
        <div className="p-5 rounded-2xl shadow-md bg-[#22C55E]/20 flex flex-col justify-between">
          <div className="flex justify-between">
            <span className="text-gray-700">Utilisateurs actifs</span>
            <span>
              <LuUserRoundCheck
                className="inline-block text-[#22C55E]"
                size={20}
              />
            </span>
          </div>

          <p className="text-xl mt-7 font-medium">{stats.activeUsers}</p>
        </div>

        {/* Card 3 - Total Products */}
        <div className="p-5 rounded-2xl shadow-md bg-[#9CA3AF]/20 flex flex-col justify-between">
          <div className="flex justify-between">
            <span className="text-gray-500">Utilisateurs inactifs </span>
            <span>
              <LuUserRoundX className="inline-block text-[#9CA3AF]" size={20} />
            </span>
          </div>

          <p className="text-2xl font-medium mt-7">{stats.inactiveUsers}</p>
        </div>

        {/* Card 4 - Active TikTok Live Sales */}
        <div className="p-5 rounded-2xl shadow-md bg-[#A855F7]/20 flex flex-col justify-between">
          <div className="flex justify-between">
            <span className="text-gray-500">Rapports générés aujourd’hui</span>
            <span>
              <FiFileText className="inline-block text-[#A855F7]" size={20} />
            </span>
          </div>

          <p className="text-2xl font-medium mt-7">{stats.projectsCreatedToday}</p>
        </div>
      </div>

    

      <div className="space-y-8 mt-5 pb-8">
      {/* ================= Recent Subscription ================= */}
      <div className="bg-white rounded-2xl p-6 mx-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Abonnements récents 
          </h2>
          <button className="text-sm text-gray-600 flex items-center gap-1">
            Voir tout  <span className="text-base">▾</span>
          </button>
        </div>

        {/* Header */}
        <div className="grid grid-cols-4 text-sm text-gray-500 bg-gray-50 rounded-lg px-5 py-3">
          <div>Nom d’utilisateur</div>
          <div>Date d’abonnement</div>
          <div>Nom de l’offre</div>
          <div className="text-right">Montant</div>
        </div>

        {/* Rows */}
       <div className="space-y-4 mt-4">
   {recentLoading && <SubscriptionRowsSkeleton />}


  {!recentLoading && recentSubscriptions.length === 0 && (
    <p className="text-sm text-gray-500 text-center">
      No recent subscriptions
    </p>
  )}

  {recentSubscriptions.map((item) => (
    <div
      key={item._id}
      className="grid grid-cols-4 items-center px-5"
    >
      <span className="font-medium text-gray-900">
        {item.userName}
      </span>

      <span className="text-sm text-gray-600">
        {formatDate(item.paymentDate)}
      </span>

      <span
        className={`px-3 py-1 text-xs rounded-full ${planBadge(
          item.planName
        )}`}
      >
        {item.planName}
      </span>

      <span className="text-sm text-gray-900 text-right">
        {formatAmount(item.amount)}
      </span>
    </div>
  ))}
</div>

      </div>

      {/* ================= Recent Activity ================= */}
      <div className="bg-white rounded-2xl p-6 mx-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Activité récente 
          </h2>
          <button className="text-sm text-gray-600 flex items-center gap-1">
            Voir tout  <span className="text-base">▾</span>
          </button>
        </div>

       <div className="space-y-5">
  {recentLoading && <ActivitySkeleton />}


  {!recentLoading && recentActivities.length === 0 && (
    <p className="text-sm text-gray-500 text-center">
      No recent activity
    </p>
  )}

  {recentActivities.map((activity) => (
    <div
      key={activity.id}
      className="flex items-start justify-between"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
          {activity.userName?.charAt(0)}
        </div>

        <div>
          <p className="font-medium text-gray-900">
            {activity.userName}
          </p>

          <p className="text-sm text-gray-500">
            {activity.action}
          </p>

          <span
            className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${activityBadge(
              activity.type
            )}`}
          >
            {activity.type.replace("_", " ")}
          </span>
        </div>
      </div>

      <span className="text-xs text-gray-500">
        {timeAgo(activity.time)}
      </span>
    </div>
  ))}
</div>

      </div>
    </div>
    </div>
  );
}

export default Dashboard;
