type RowWithPrimaryPhoto = {
  primary_photo: string | null;
};

const PHOTO_URL_TTL_SECONDS = 60 * 60;

export async function signProfilePhotoUrls(
  supabase: any,
  paths: Array<string | null | undefined>,
): Promise<Record<string, string | null>> {
  const uniquePaths = Array.from(
    new Set(paths.filter((path): path is string => typeof path === "string" && path.length > 0)),
  );

  if (uniquePaths.length === 0) {
    return {};
  }

  const entries = await Promise.all(
    uniquePaths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(path, PHOTO_URL_TTL_SECONDS);

      if (error) {
        return [path, null] as const;
      }

      return [path, data?.signedUrl ?? null] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export function withPrimaryPhotoUrls<T extends RowWithPrimaryPhoto>(
  rows: T[],
  urlMap: Record<string, string | null>,
): Array<T & { primary_photo_url: string | null }> {
  return rows.map((row) => ({
    ...row,
    primary_photo_url: row.primary_photo ? (urlMap[row.primary_photo] ?? null) : null,
  }));
}
