type PaperlessUploadInput = {
  pdf: Buffer;
  filename: string;
  title: string;
  documentCode: string;
};

export function isPaperlessEnabled() {
  return String(process.env.PAPERLESS_ENABLED || "false").toLowerCase() === "true";
}

function getPaperlessUrl() {
  return (process.env.PAPERLESS_URL || "").replace(/\/$/, "");
}

function getPaperlessTags() {
  return (process.env.PAPERLESS_TAGS || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getPaperlessCorrespondent() {
  return (process.env.PAPERLESS_CORRESPONDENT || "Heptapus").trim();
}

type PaperlessListResponse = { count: number; results: { id: number; name: string }[] };

/**
 * Paperless' `post_document` endpoint expects numeric primary keys for
 * `correspondent` and `tags`, not names. This resolves a name to its id,
 * creating the object if it does not exist yet.
 *
 * `resource` is "correspondents" or "tags".
 */
async function resolveId(baseUrl: string, token: string, resource: string, name: string): Promise<number> {
  const headers = { Authorization: `Token ${token}` };

  const lookup = await fetch(
    `${baseUrl}/api/${resource}/?name__iexact=${encodeURIComponent(name)}`,
    { headers }
  );
  if (lookup.ok) {
    const data = (await lookup.json()) as PaperlessListResponse;
    const match = data.results?.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (match) return match.id;
    if (data.results?.length) return data.results[0].id;
  }

  const created = await fetch(`${baseUrl}/api/${resource}/`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (!created.ok) {
    const body = await created.text();
    throw new Error(`Paperless ${resource} lookup/create failed (${created.status}): ${body.slice(0, 300)}`);
  }
  const createdData = (await created.json()) as { id: number };
  return createdData.id;
}

export async function uploadSignedPdfToPaperless(input: PaperlessUploadInput) {
  if (!isPaperlessEnabled()) {
    return { skipped: true as const };
  }

  const baseUrl = getPaperlessUrl();
  const token = process.env.PAPERLESS_TOKEN || "";
  if (!baseUrl) throw new Error("PAPERLESS_URL is required when Paperless sync is enabled.");
  if (!token) throw new Error("PAPERLESS_TOKEN is required when Paperless sync is enabled.");

  const form = new FormData();
  const pdfBytes = new Uint8Array(input.pdf);
  form.set("document", new Blob([pdfBytes.buffer], { type: "application/pdf" }), input.filename);
  form.set("title", `${input.documentCode} - ${input.title}`);

  // Resolve names to primary keys; Paperless rejects name strings here.
  const correspondentName = getPaperlessCorrespondent();
  if (correspondentName) {
    const correspondentId = await resolveId(baseUrl, token, "correspondents", correspondentName);
    form.set("correspondent", String(correspondentId));
  }

  for (const tagName of getPaperlessTags()) {
    const tagId = await resolveId(baseUrl, token, "tags", tagName);
    form.append("tags", String(tagId));
  }

  const response = await fetch(`${baseUrl}/api/documents/post_document/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`
    },
    body: form
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Paperless upload failed (${response.status}): ${body.slice(0, 500)}`);
  }

  return {
    skipped: false as const,
    taskId: body.trim().replace(/^"|"$/g, "")
  };
}
