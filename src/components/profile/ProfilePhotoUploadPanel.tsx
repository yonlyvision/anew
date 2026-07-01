import { toast } from "sonner";

import { useSignedPhotoUrls } from "@/hooks/useSignedPhotoUrl";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 8 * 1024 * 1024;

type ProfilePhotoUploadPanelProps = {
  userId: string;
  photos: string[];
  primary: string | null;
  onChange: (next: { photos: string[]; primary: string | null }) => void;
  fallbackInitial?: string;
  compact?: boolean;
  maxPhotos?: number;
};

export function ProfilePhotoUploadPanel({
  userId,
  photos,
  primary,
  onChange,
  fallbackInitial,
  compact = false,
  maxPhotos = 6,
}: ProfilePhotoUploadPanelProps) {
  const { urls } = useSignedPhotoUrls(photos);
  const lead = primary ?? photos[0] ?? null;
  const leadUrl = lead ? urls[lead] : null;

  async function onUpload(file: File) {
    if (photos.length >= maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 8MB");
      return;
    }
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/photo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const nextPhotos = [...photos, path];
      const nextPrimary = primary ?? path;
      const { error } = await supabase
        .from("profiles")
        .update({ photos: nextPhotos, primary_photo: nextPrimary })
        .eq("id", userId);
      if (error) throw error;

      onChange({ photos: nextPhotos, primary: nextPrimary });
      toast.success("Photo saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onRemove(path: string) {
    try {
      const nextPhotos = photos.filter((photo) => photo !== path);
      const nextPrimary = primary === path ? (nextPhotos[0] ?? null) : primary;
      const { error } = await supabase
        .from("profiles")
        .update({ photos: nextPhotos, primary_photo: nextPrimary })
        .eq("id", userId);
      if (error) throw error;
      await supabase.storage.from("profile-photos").remove([path]);
      onChange({ photos: nextPhotos, primary: nextPrimary });
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove photo");
    }
  }

  async function onMakePrimary(path: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ primary_photo: path })
        .eq("id", userId);
      if (error) throw error;
      onChange({ photos, primary: path });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update photo");
    }
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-ink/10 bg-muted-warm">
          {leadUrl ? (
            <img src={leadUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f6d8cf] to-[#d67e64] font-serif text-3xl text-paper">
              {(fallbackInitial || "?").toUpperCase()}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-ink/60">
            Optional — add a photo so matches can recognize you. You can skip this anytime.
          </p>
          {photos.length < maxPhotos && (
            <label className="inline-flex cursor-pointer rounded-full border border-ink px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-ink transition-colors hover:bg-ink hover:text-paper">
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          {photos.length > 0 && lead && (
            <button
              type="button"
              onClick={() => void onRemove(lead)}
              className="block text-xs text-ink/45 hover:text-destructive"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.7rem] border border-ink/8 bg-muted-warm">
        {leadUrl ? (
          <img src={leadUrl} alt="" className="aspect-[5/4] w-full object-cover" />
        ) : (
          <div className="flex aspect-[5/4] items-center justify-center bg-[radial-gradient(circle_at_30%_20%,_rgba(255,245,232,0.95),_transparent_22%),radial-gradient(circle_at_76%_18%,_rgba(229,98,84,0.24),_transparent_24%),linear-gradient(180deg,_rgba(229,189,161,0.72),_rgba(104,79,67,0.92))]">
            <span className="font-serif text-7xl text-paper/90">
              {(fallbackInitial || "?").toUpperCase()}
            </span>
          </div>
        )}
        <div className="border-t border-ink/8 bg-paper px-5 py-4">
          <p className="text-sm font-medium text-ink">Profile photo</p>
          <p className="mt-1 text-xs text-ink/50">
            Optional for now. Stored securely — it stays on your account when you upload it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <div
            key={photo}
            className="relative overflow-hidden rounded-[1.2rem] border border-ink/8 bg-muted-warm"
          >
            {urls[photo] ? (
              <img src={urls[photo]!} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="aspect-square bg-ink/5" />
            )}
            {primary === photo && (
              <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-paper">
                Primary
              </span>
            )}
            <div className="absolute inset-x-2 bottom-2 flex gap-2">
              {primary !== photo && (
                <button
                  type="button"
                  onClick={() => void onMakePrimary(photo)}
                  className="flex-1 rounded-full bg-paper/90 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-ink backdrop-blur hover:bg-ink hover:text-paper"
                >
                  Primary
                </button>
              )}
              <button
                type="button"
                onClick={() => void onRemove(photo)}
                className="rounded-full bg-paper/90 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-destructive backdrop-blur hover:bg-destructive hover:text-paper"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[1.2rem] border border-dashed border-ink/16 bg-paper px-3 text-center text-[11px] uppercase tracking-[0.2em] text-ink/50 transition-colors hover:border-ink/28 hover:text-ink">
            Add photo
            <span className="mt-1 normal-case tracking-normal text-[10px] text-ink/40">
              JPG, PNG · max 8MB
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
