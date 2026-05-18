"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ManagePageHeader } from "@/components/layout/manage-page-header";
import {
  QuestionBuilder,
  type QuestionBuilderFormData,
} from "@/components/questionnaire/question-builder";
import { CreatedLinkModal } from "@/components/questionnaire/created-link-modal";
import type { Questionnaire } from "@/lib/domain/types";
import { mapQuestionnaireToBuilderState } from "@/lib/map-questionnaire-to-builder";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function NewQuestionnaireContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const envId = params.envId as string;
  const draftId = searchParams.get("draft");

  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftLoadingState, setDraftLoadingState] = useState(!!draftId);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(draftId);
  const [initialState, setInitialState] = useState<
    ReturnType<typeof mapQuestionnaireToBuilderState> | undefined
  >(undefined);
  const [environmentLogos, setEnvironmentLogos] = useState<
    import("@/lib/domain/types").BrandLogo[]
  >([]);
  const [environmentDefaultLogoSize, setEnvironmentDefaultLogoSize] =
    useState<import("@/lib/domain/types").LogoSize>("md");

  useEffect(() => {
    fetch(`/api/environments/${envId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.environment) {
          setEnvironmentLogos(data.environment.logos ?? []);
          setEnvironmentDefaultLogoSize(data.environment.defaultLogoSize ?? "md");
        }
      });
  }, [envId]);

  useEffect(() => {
    if (!draftId) {
      setDraftLoadingState(false);
      return;
    }
    fetch(`/api/questionnaires/${draftId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.questionnaire) {
          const q = data.questionnaire as Questionnaire;
          setInitialState(mapQuestionnaireToBuilderState(q));
          setQuestionnaireId(q.id);
        }
        setDraftLoadingState(false);
      });
  }, [draftId]);

  const savePayload = (data: QuestionBuilderFormData, isDraft: boolean) => ({
    environmentId: envId,
    ...data,
    isDraft,
    isActive: isDraft ? false : data.isActive,
  });

  const handleSaveDraft = async (data: QuestionBuilderFormData) => {
    setDraftLoading(true);
    const body = savePayload(data, true);
    const res = await fetch(
      questionnaireId ? `/api/questionnaires/${questionnaireId}` : "/api/questionnaires",
      {
        method: questionnaireId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const result = await res.json();
    setDraftLoading(false);

    if (!res.ok) {
      toast.error(result.error ?? "שגיאה בשמירת הטיוטה");
      return;
    }

    const id = result.questionnaire.id as string;
    setQuestionnaireId(id);
    if (!draftId) {
      router.replace(`/manage/${envId}/questionnaires/new?draft=${id}`);
    }
  };

  const handleSubmit = async (data: QuestionBuilderFormData) => {
    setLoading(true);
    const body = savePayload(data, false);
    const res = await fetch(
      questionnaireId ? `/api/questionnaires/${questionnaireId}` : "/api/questionnaires",
      {
        method: questionnaireId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(result.error ?? "שגיאה ביצירת השאלון");
      return;
    }

    setPublicUrl(result.publicUrl);
    setQuestionnaireId(result.questionnaire.id);
  };

  return (
    <>
      <ManagePageHeader
        title={draftId ? "עריכת טיוטה" : "הקמת שאלון"}
        subtitle="הגדרת שאלות והגדרות השאלון"
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {draftLoadingState ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <QuestionBuilder
            key={questionnaireId ?? "new"}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            loading={loading}
            draftLoading={draftLoading}
            environmentLogos={environmentLogos}
            environmentDefaultLogoSize={environmentDefaultLogoSize}
            initialState={initialState}
          />
        )}
      </div>

      {publicUrl && questionnaireId && (
        <CreatedLinkModal
          publicUrl={publicUrl}
          onClose={() =>
            router.push(`/manage/${envId}/questionnaires/${questionnaireId}`)
          }
        />
      )}
    </>
  );
}

export default function NewQuestionnairePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-6 py-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <NewQuestionnaireContent />
    </Suspense>
  );
}
