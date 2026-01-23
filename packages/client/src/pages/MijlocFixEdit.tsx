import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { MijlocFix } from "shared";
import { api } from "@/lib/api";
import { MijlocFixForm } from "@/components/mijloace-fixe/MijlocFixForm";
import { Button } from "@/components/ui/button";

export function MijlocFixEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [mijlocFix, setMijlocFix] = useState<MijlocFix | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setError(null);
      api.get<MijlocFix>(`/mijloace-fixe/${id}`).then((res) => {
        if (res.success && res.data) {
          setMijlocFix(res.data);
        } else {
          setError(res.message || "Nu s-a putut incarca mijlocul fix");
        }
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleSuccess = () => {
    // Navigate to detail page after create, or back to detail after edit
    if (isEditMode) {
      navigate(`/mijloace-fixe/${id}`);
    } else {
      navigate("/mijloace-fixe");
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Eroare</h1>
        </div>
        <div className="p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Editeaza Mijloc Fix" : "Adauga Mijloc Fix"}
          </h1>
          {isEditMode && mijlocFix && (
            <p className="text-muted-foreground">
              {mijlocFix.numarInventar} - {mijlocFix.denumire}
            </p>
          )}
        </div>
      </div>

      <MijlocFixForm
        key={id || "new"} // Key by id to reset form when navigating between assets
        mijlocFix={mijlocFix}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
