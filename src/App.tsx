import { useEffect, useMemo, useState } from "react";
import { useGetTemplate } from "./hooks/useTemplate";
import logo from "../src/assets/hmbLogo.png";
import {
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  Clock,
  Sparkles,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { getItemIcon } from "./utilities/icons";
import { useGetEquipmentById } from "./hooks/useEquipments";
import { useSaveChecklist } from "./hooks/useChecklist";
import { useSearchParams } from "react-router-dom";

function App() {
  const [searchParams] = useSearchParams();
  const equipmentIdParam = searchParams.get("id");
  const equipmentId = equipmentIdParam ? Number(equipmentIdParam) : 101;

  const { data: template, isLoading, isError } = useGetTemplate();
  const { data: equipment } = useGetEquipmentById(equipmentId);
  const { mutate: saveChecklistMutation, isPending: isSaving } =
    useSaveChecklist();

  // 1. Inicialización del estado sincronizada con el equipmentId de la URL
  const [checklistPayload, setChecklistPayload] = useState({
    templateId: 1,
    vehicleId: equipmentId, // Sincronizado directamente desde la URL
    checklistStatus: "in progress",
    generalComment: "",
    answers: [] as Array<{
      checklistItemId: number;
      answer: string;
      answerComment: string;
    }>,
  });

  // Asegurar que si el equipmentId cambia en la URL, se actualice en el payload
  useEffect(() => {
    setChecklistPayload((prev) => ({
      ...prev,
      vehicleId: equipmentId,
    }));
  }, [equipmentId]);

  const [expandedComments, setExpandedComments] = useState<
    Record<number, boolean>
  >({});
  const [notification, setNotification] = useState<{
    message: string;
    type: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const items = template?.items ?? [];

  const progressStats = useMemo(() => {
    const total = items.length;

    const answeredCount = checklistPayload.answers.filter(
      (answer) => answer.answer?.trim() !== "",
    ).length;

    const percentage =
      total > 0 ? Math.round((answeredCount / total) * 100) : 0;

    return {
      total,
      answeredCount,
      percentage,
    };
  }, [items.length, checklistPayload.answers]);

  const handleAnswerSelect = (
    checklistItemId: number,
    selectedOption: string,
  ) => {
    const existingAnswer = checklistPayload.answers.find(
      (answer) => answer.checklistItemId === checklistItemId,
    );

    if (existingAnswer?.answer === selectedOption) {
      setChecklistPayload((prev) => ({
        ...prev,
        answers: prev.answers.map((answer) =>
          answer.checklistItemId === checklistItemId
            ? { ...answer, answer: "" }
            : answer,
        ),
      }));
      return;
    }

    setChecklistPayload((prev) => ({
      ...prev,
      answers: prev.answers.map((answer) =>
        answer.checklistItemId === checklistItemId
          ? { ...answer, answer: selectedOption }
          : answer,
      ),
    }));

    if (window.matchMedia("(max-width: 767px)").matches) {
      setCurrentStep((step) => Math.min(step + 1, items.length - 1));
    }
  };

  const handleCommentChange = (
    checklistItemId: number,
    commentText: string,
  ) => {
    setChecklistPayload((prev) => ({
      ...prev,
      answers: prev.answers.map((answer) =>
        answer.checklistItemId === checklistItemId
          ? { ...answer, answerComment: commentText }
          : answer,
      ),
    }));
  };

  const handleGeneralCommentChange = (commentText: string) => {
    setChecklistPayload((prev) => ({
      ...prev,
      generalComment: commentText,
    }));
  };

  const toggleCommentBox = (itemId: number) => {
    setExpandedComments((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const showToast = (message: string, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleSave = (newStatus = "in progress") => {
    if (newStatus === "completed") {
      const uncompletedRequired = items.filter((item) => {
        if (!item.isRequired) return false;
        const answer = checklistPayload.answers.find(
          (entry) => entry.checklistItemId === item.itemId,
        );
        return !answer?.answer;
      });

      if (uncompletedRequired.length > 0) {
        showToast(
          `Please answer all required items (${uncompletedRequired.length} remaining).`,
          "error",
        );
        return;
      }
    }

    const finalPayload = {
      id: null,
      templateId: Number(template?.templateId || checklistPayload.templateId),
      vehicleId: Number(equipmentId), // Usamos el ID seguro de la URL
      checklistStatus: newStatus,
      generalComment: checklistPayload.generalComment || "",
      answers: checklistPayload.answers.map((ans) => ({
        id: null,
        itemId: Number(ans.checklistItemId),
        answer: ans.answer || "",
        comment: ans.answerComment || "",
      })),
    };

    saveChecklistMutation(
      { data: finalPayload },
      {
        onSuccess: () => {
          if (newStatus === "completed") {
            showToast("Inspection completed successfully!", "success");
          } else {
            showToast("Inspection draft saved successfully.", "info");
          }
        },
        onError: (error) => {
          console.error(error);
          showToast("Failed to save inspection. Please try again.", "error");
        },
      },
    );
  };

  const handleReset = () => {
    setChecklistPayload({
      templateId: template?.templateId || 1,
      vehicleId: equipmentId,
      checklistStatus: "in progress",
      generalComment: "",
      answers: items.map((item) => ({
        checklistItemId: item.itemId,
        answer: "",
        answerComment: "",
      })),
    });
    setExpandedComments({});
    setCurrentStep(0);
    showToast("Inspection form reset.", "info");
  };

  const goToNext = () =>
    setCurrentStep((step) => Math.min(step + 1, items.length - 1));
  const goToPrevious = () => setCurrentStep((step) => Math.max(step - 1, 0));

  useEffect(() => {
    if (template?.items && checklistPayload.answers.length === 0) {
      setChecklistPayload((prev) => ({
        ...prev,
        templateId: template.templateId || 1,
        answers: template.items.map((item) => ({
          checklistItemId: item.itemId,
          answer: "",
          answerComment: "",
        })),
      }));
    }
  }, [template]);

  const getDynamicOptionStyle = (optionValue: string, isSelected: boolean) => {
    const val = String(optionValue).toUpperCase();

    if (
      val.includes("OK") ||
      val.includes("YES") ||
      val.includes("SI") ||
      val.includes("BUENO")
    ) {
      return isSelected
        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold scale-[1.02]"
        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    }

    if (
      val.includes("DEFECT") ||
      val.includes("NO") ||
      val.includes("MAL") ||
      val.includes("FAIL")
    ) {
      return isSelected
        ? "bg-rose-600 text-white border-rose-600 shadow-sm font-semibold scale-[1.02]"
        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
    }

    return isSelected
      ? "bg-slate-700 text-white border-slate-700 shadow-sm font-semibold scale-[1.02]"
      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600">
        <p className="text-sm font-medium animate-pulse">
          Loading inspection...
        </p>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-rose-600 p-4 text-center">
        <p className="text-sm font-medium">
          Failed to load inspection template.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32 pt-4 px-3 sm:px-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100%-2rem)] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium border transition-all duration-300 ${
            notification.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          {notification.type === "error" && (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          {notification.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {notification.type === "info" && (
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <header className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-30 h-20 sm:w-30 sm:h-15 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src={logo || "/placeholder-logo.png"}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="pt-4 pb-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {template.title || "Pre-Trip Inspection"}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {template.description ||
                    "Inspect the vehicle thoroughly before operating."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-900 text-white shadow-xs">
                #{equipment?.number || equipmentId}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-900 text-white shadow-xs">
                #{equipment?.name || "Equipment"}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 border ${
                  checklistPayload.checklistStatus === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {checklistPayload.checklistStatus}
              </span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all text-xs font-medium shrink-0"
              title="Reset inspection"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </header>

        {/* Checklist Items */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, idx) => {
            const answerObj = checklistPayload.answers.find(
              (answer) => answer.checklistItemId === item.itemId,
            ) || { answer: "", answerComment: "" };

            const selectedAnswer = answerObj.answer || "";
            const hasComment = Boolean(answerObj.answerComment);
            const isExpanded = Boolean(expandedComments[item.itemId]);

            const optionsCount = item.options?.length || 3;
            const gridColsClass =
              optionsCount === 2
                ? "grid-cols-2"
                : optionsCount === 4
                  ? "grid-cols-2 sm:grid-cols-4"
                  : optionsCount >= 5
                    ? "grid-cols-3 sm:grid-cols-3"
                    : "grid-cols-3";

            return (
              <section
                key={item.itemId ?? idx}
                className={`${
                  idx === currentStep ? "block" : "hidden"
                } md:!block bg-white rounded-2xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between ${
                  selectedAnswer ? "border-emerald-200" : "border-slate-200"
                } shadow-sm`}
              >
                <div>
                  <div className="flex items-start gap-3 mb-5">
                    <span className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                      {getItemIcon(item.item)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold text-slate-900 leading-snug">
                          {item.item}
                        </h2>
                      </div>
                      {item.isRequired && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md font-semibold">
                          REQUIRED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Answer Options Dinámicas */}
                  <div className={`grid ${gridColsClass} gap-2 my-3`}>
                    {(item.options || []).map((option, optionIndex) => {
                      const isSelected =
                        selectedAnswer.toUpperCase() ===
                        option.option.toUpperCase();

                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            handleAnswerSelect(item.itemId, option.option)
                          }
                          className={`min-h-12 py-3 px-2 text-xs sm:text-sm font-medium rounded-xl border transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${getDynamicOptionStyle(
                            option.option,
                            isSelected,
                          )}`}
                        >
                          {isSelected && <Check className="w-4 h-4 shrink-0" />}
                          <span className="truncate">{option.option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment Section */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleCommentBox(item.itemId)}
                    aria-expanded={isExpanded}
                    className={`w-full flex items-center justify-between text-sm py-2 px-1 rounded-lg transition-colors ${
                      hasComment
                        ? "text-emerald-700 font-medium"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {hasComment ? "Edit comment" : "Add a comment"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2">
                      <textarea
                        value={answerObj.answerComment || ""}
                        onChange={(event) =>
                          handleCommentChange(item.itemId, event.target.value)
                        }
                        placeholder="Add details or notes about this item..."
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none h-24 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </main>

        {/* Mobile Question Navigation */}
        {items.length > 0 && (
          <section className="md:hidden bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">
                Question {currentStep + 1} of {items.length}
              </span>
              <span className="text-sm font-semibold text-emerald-700">
                {progressStats.percentage}% complete
              </span>
            </div>

            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / items.length) * 100}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={currentStep === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                Previous
              </button>

              <button
                type="button"
                onClick={goToNext}
                disabled={currentStep >= items.length - 1}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </section>
        )}

        {/* General Comments */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              General Inspection Comments
            </span>
          </label>
          <textarea
            value={checklistPayload.generalComment || ""}
            onChange={(event) => handleGeneralCommentChange(event.target.value)}
            placeholder="Add any general observations about the vehicle..."
            className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none h-28 text-slate-800 placeholder:text-slate-400"
          />
        </section>
      </div>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* <button
            type="button"
            onClick={() => handleSave("in progress")}
            disabled={isSaving}
            className="flex-1 py-3 px-3 sm:px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <Save className="w-4 h-4 shrink-0" />
            )}
            <span>Save Draft</span>
          </button> */}

          <button
            type="button"
            onClick={() => handleSave("completed")}
            disabled={isSaving}
            className="flex-1 py-3 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <Send className="w-4 h-4 shrink-0" />
            )}
            <span>Complete Inspection</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
