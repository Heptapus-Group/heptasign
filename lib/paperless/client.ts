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
  form.set("correspondent", "Heptapus");

  const tags = getPaperlessTags();
  for (const tag of tags) {
    form.append("tags", tag);
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
