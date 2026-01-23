import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  FaListUl,
  FaLock,
  FaEnvelope,
  FaUpload,
  FaFileAlt,
} from "react-icons/fa";
import Navbar from "../Components/Navbar";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { toast } from "react-toastify";
import Skeleton from "@mui/material/Skeleton";
import { useNavigate } from "react-router-dom";

const TabsSkeleton = () => (
  <div className="flex gap-3 mb-6">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} variant="rounded" width={180} height={40} />
    ))}
  </div>
);

const EditorSkeleton = () => (
  <div className="space-y-4">
    <Skeleton variant="rounded" height={320} />
    <div className="flex justify-end">
      <Skeleton variant="rounded" width={200} height={40} />
    </div>
  </div>
);

const VideoSkeleton = () => (
  <div className="space-y-6">
    <Skeleton variant="rounded" height={40} />
    <Skeleton variant="rounded" height={300} />
    <div className="flex justify-end gap-3">
      <Skeleton variant="rounded" width={120} height={40} />
      <Skeleton variant="rounded" width={160} height={40} />
    </div>
  </div>
);

export default function CMS() {
  const [activeTab, setActiveTab] = useState("terms");
  const navigate = useNavigate();

  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");

  const [videoTitle, setVideoTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [published, setPublished] = useState(true);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fileRef = useRef(null);

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

  // ---------------- LOAD INITIAL CONTENT ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          "https://api.emibocquillon.fr/api/content/get",
          authConfig,
        );
        console.log(res);
        if (res.data?.success) {
          const content = res.data.content;

          setTermsContent(content?.TermsAndConditions || "");
          setPrivacyContent(content?.PrivacyPolicy || "");

          if (content?.TutorialMangment) {
            setVideoTitle(content.TutorialMangment.VideoTittle || "");

            if (res.data?.videoDetails?.streamUrl) {
              setVideoPreview(
                `https://api.emibocquillon.fr${res.data.videoDetails.streamUrl}`,
              );
            }
          }
        }
      } catch (err) {
        console.error(err);

        if (handleAuthError(err)) return;

        setMessage("Failed to load CMS content.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ---------------- FILE HANDLING ----------------
  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMessage("Only video files are allowed.");
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setMessage("Maximum file size is 200MB.");
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const clearVideo = () => {
    if (videoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(null);
    setVideoPreview(null);
    setVideoTitle("");
    setMessage("");

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // ---------------- SAVE TERMS ----------------
  const saveTerms = async () => {
    const loadingToast = toast.loading("Enregistrement des conditions...");

    try {
      setSaving(true);

      await axios.post(
        "https://api.emibocquillon.fr/api/content/terms-and-conditions",
        { termsAndConditions: termsContent },
        authConfig,
      );

      toast.update(loadingToast, {
        render: "Conditions enregistrées avec succès",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);

      toast.update(loadingToast, {
        render: "Échec de l'enregistrement des conditions",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------------- SAVE PRIVACY ----------------
  const savePrivacy = async () => {
    const loadingToast = toast.loading(
      "Enregistrement de la politique de confidentialité...",
    );

    try {
      setSaving(true);

      await axios.post(
        "https://api.emibocquillon.fr/api/content/privacy-policy",
        { privacyPolicy: privacyContent },
        authConfig,
      );

      toast.update(loadingToast, {
        render: "Politique de confidentialité enregistrée avec succès",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);

      toast.update(loadingToast, {
        render: "Échec de l'enregistrement de la politique de confidentialité",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ---------------- SAVE VIDEO ----------------
  const saveVideo = async () => {
    if (!videoFile) {
      toast.warning("Veuillez d'abord uploader une vidéo");
      return;
    }

    const loadingToast = toast.loading("Téléversement de la vidéo...");

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("title", videoTitle);
      formData.append("video", videoFile);
      formData.append("published", published);

      await axios.post(
        "https://api.emibocquillon.fr/api/content/upload-video",
        formData,
        authConfig,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      toast.update(loadingToast, {
        render: "Vidéo tutorielle téléversée avec succès",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);

      toast.update(loadingToast, {
        render: "Échec du téléversement de la vidéo",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const tabClass = (key) =>
    `flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition
     ${
       activeTab === key
         ? "bg-green-400 border-green-500 text-black"
         : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
     }`;

  // ---------------- FULL SCREEN LOADER ----------------

  return (
    <div>
      <Navbar heading="Système de gestion de contenu" />

      <div className="w-full p-6 bg-gray-100">
        {/* STATUS */}
        {(loading || saving) && (
          <div className="mb-4 text-sm font-medium text-blue-700">
            {saving && "Saving data to server..."}
          </div>
        )}

        {/* TABS */}
        {loading ? (
          <TabsSkeleton />
        ) : (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab("terms")}
              className={tabClass("terms")}
            >
              <FaListUl /> Conditions générales
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={tabClass("privacy")}
            >
              <FaLock /> Politique de confidentialité
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={tabClass("video")}
            >
              <FaEnvelope /> Gestion des tutoriels
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg p-6">
          {/* CONTENT SKELETON */}
          {loading ? (
            <>
              {activeTab === "terms" && <EditorSkeleton />}
              {activeTab === "privacy" && <EditorSkeleton />}
              {activeTab === "video" && <VideoSkeleton />}
            </>
          ) : (
            <>
              {/* TERMS */}
              {activeTab === "terms" && (
                <div className="space-y-4">
                  <CKEditor
                    editor={ClassicEditor}
                    data={termsContent}
                    onChange={(event, editor) => {
                      setTermsContent(editor.getData());
                    }}
                    config={{
                      toolbar: [
                        "bold",
                        "italic",
                        "link",
                        "|",
                        "numberedList",
                        "|",
                        "undo",
                        "redo",
                      ],
                    }}
                  />

                  <div className="w-full flex justify-end">
                    <button
                      onClick={saveTerms}
                      disabled={saving}
                      className={`px-5 py-2 rounded-full text-white ${
                        saving ? "bg-gray-400" : "bg-green-900"
                      }`}
                    >
                      {saving ? "Saving..." : "Enregistrer les conditions"}
                    </button>
                  </div>
                </div>
              )}

              {/* PRIVACY */}
              {activeTab === "privacy" && (
                <div className="space-y-4">
                  <CKEditor
                    editor={ClassicEditor}
                    data={privacyContent}
                    onChange={(event, editor) => {
                      setPrivacyContent(editor.getData());
                    }}
                    config={{
                      toolbar: [
                        "bold",
                        "italic",
                        "link",
                        "|",
                        "numberedList",
                        "|",
                        "undo",
                        "redo",
                      ],
                    }}
                  />

                  <div className="w-full flex justify-end">
                    <button
                      onClick={savePrivacy}
                      disabled={saving}
                      className={`px-5 py-2 rounded-full text-white ${
                        saving ? "bg-gray-400" : "bg-green-900"
                      }`}
                    >
                      {saving ? "Saving..." : "Enregistrer la confidentialité"}
                    </button>
                  </div>
                </div>
              )}

              {/* VIDEO */}
              {activeTab === "video" && (
                <div className="space-y-6">
                  <input
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full border border-gray-400 rounded-md px-3 py-2 text-sm"
                    placeholder="Tutorial video title"
                  />

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed rounded-lg p-8 text-center"
                  >
                    {!videoPreview ? (
                      <>
                        <FaFileAlt className="text-5xl text-gray-300 mb-3 mx-auto" />
                        <button
                          onClick={() => fileRef.current.click()}
                          className="border px-4 py-2 rounded-full"
                        >
                          <FaUpload className="inline mr-2" /> Upload Video
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="mb-2">
                          {videoFile
                            ? videoFile.name
                            : "Existing uploaded video"}
                        </p>
                        <video
                          controls
                          src={videoPreview}
                          className="w-full h-96 rounded-lg"
                        />
                      </>
                    )}

                    <input
                      ref={fileRef}
                      type="file"
                      hidden
                      accept="video/*"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                    />
                  </div>

                  <div className="w-full flex justify-end gap-3">
                    {videoPreview && (
                      <button
                        type="button"
                        onClick={clearVideo}
                        disabled={saving}
                        className="px-5 py-2 rounded-full border border-red-500 text-red-600 hover:bg-red-50"
                      >
                        Clear
                      </button>
                    )}

                    <button
                      onClick={saveVideo}
                      disabled={saving}
                      className={`px-5 py-2 rounded-full text-white ${
                        saving ? "bg-gray-400" : "bg-green-900"
                      }`}
                    >
                      {saving ? "Uploading..." : "Enregistrer la vidéo"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
