"use client";

import { DownloadIcon } from "@sanity/icons/Download";
import { UploadIcon } from "@sanity/icons/Upload";
import { Badge, Box, Button, Card, Flex, Heading, Text } from "@sanity/ui";
import { useRef, useState, type ChangeEvent } from "react";
import { useClient, type Tool } from "sanity";
import {
  CATALOG_HEADERS,
  CSV_TYPES,
  docToRow,
  rowToImport,
  type ImportRow,
  type SanityProductDoc,
} from "@/lib/catalog-csv";
import { parseCsv, toCsv } from "@/lib/csv";
import { apiVersion } from "../env";

const PRODUCTS_QUERY = `*[_type in $types && !(_id in path("drafts.**"))] | order(_type asc, name asc) {
  _id, _type, name, slug, brand, description, condition, conditionNotes, stock, prices,
  medium, mount, sensor, megapixels, video, filmFormat, style,
  focalLength, maxAperture, stabilized, kind, compatibleMounts
}`;

const BATCH = 100;

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

function CatalogCsvTool() {
  const client = useClient({ apiVersion });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "positive" | "critical" | "default"; text: string } | null>(null);
  const [preview, setPreview] = useState<ImportRow[] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadProducts = () => client.fetch<SanityProductDoc[]>(PRODUCTS_QUERY, { types: [...CSV_TYPES] });

  async function exportCsv() {
    setBusy(true);
    try {
      const products = await loadProducts();
      download(`retro-camera-catalog-${today()}.csv`, toCsv(CATALOG_HEADERS, products.map(docToRow)));
      setMessage({ tone: "positive", text: `Exported ${products.length} products.` });
    } catch (error) {
      setMessage({ tone: "critical", text: `Export failed: ${(error as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const { headers, rows } = parseCsv(await file.text());
      const missing = ["type", "name", "slug"].filter((h) => !headers.includes(h));
      if (missing.length) throw new Error(`The file has no ${missing.join(", ")} column. Export first to get a template.`);

      const products = await loadProducts();
      const existing = {
        ids: new Set(products.map((p) => p._id)),
        idBySlug: new Map(products.flatMap((p) => (p.slug?.current ? [[p.slug.current, p._id] as const] : []))),
      };

      const results = rows.map((row, i) => rowToImport(row, i + 2, existing)); // +2: header is row 1
      // The same product twice in one file would make the result depend on row order.
      const seen = new Map<string, number>();
      const checked = results.map((result): ImportRow => {
        if (!result.ok) return result;
        const first = seen.get(result.id);
        if (first !== undefined) {
          return { ok: false, line: result.line, label: result.id, errors: [`same product as row ${first}`] };
        }
        seen.set(result.id, result.line);
        return result;
      });
      setPreview(checked);
    } catch (error) {
      setMessage({ tone: "critical", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    const valid = preview?.filter((r): r is Extract<ImportRow, { ok: true }> => r.ok) ?? [];
    setBusy(true);
    try {
      for (let i = 0; i < valid.length; i += BATCH) {
        const transaction = client.transaction();
        for (const row of valid.slice(i, i + BATCH)) {
          // Patch rather than replace, so photos and other fields not in the CSV are kept.
          transaction.createIfNotExists({ _id: row.id, _type: row.type });
          transaction.patch(row.id, (patch) => patch.set(row.set).unset(row.unset));
        }
        await transaction.commit({ visibility: "async" });
      }
      setMessage({ tone: "positive", text: `Imported ${valid.length} products. They're live now.` });
      setPreview(null);
    } catch (error) {
      setMessage({ tone: "critical", text: `Import stopped: ${(error as Error).message}. Earlier batches were saved.` });
    } finally {
      setBusy(false);
    }
  }

  const valid = preview?.filter((r) => r.ok) ?? [];
  const invalid = preview?.filter((r): r is Extract<ImportRow, { ok: false }> => !r.ok) ?? [];
  const created = valid.filter((r) => r.ok && r.isNew).length;

  return (
    <Box padding={5} style={{ maxWidth: 900 }}>
      <Flex direction="column" gap={5}>
        <Flex direction="column" gap={3}>
          <Heading>Import / Export</Heading>
          <Text muted>
            Cameras, lenses and accessories as a spreadsheet (CSV). Bundles, photos and payment details stay in the
            Studio. Costs are private and live in the store admin, not here.
          </Text>
        </Flex>

        <Card padding={4} radius={3} border>
          <Flex direction="column" gap={4}>
            <Heading>Export</Heading>
            <Text muted>
              Downloads every published product. Also use it as a template: edit it, then import it back.
            </Text>
            <Flex>
              <Button icon={DownloadIcon} text="Export CSV" tone="primary" onClick={exportCsv} disabled={busy} />
            </Flex>
          </Flex>
        </Card>

        <Card padding={4} radius={3} border>
          <Flex direction="column" gap={4}>
            <Heading>Import</Heading>
            <Text muted>
              Rows are matched by id, then slug. Matching products are updated; others are created. Nothing is saved
              until you confirm. Prices are in pesos (18500 or 18,500). Separate compatible mounts with semicolons.
            </Text>
            <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={readFile} hidden />
            <Flex>
              <Button
                icon={UploadIcon}
                text="Choose CSV file…"
                mode="ghost"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
              />
            </Flex>

            {preview && (
              <Flex direction="column" gap={3}>
                <Flex gap={2} wrap="wrap">
                  <Badge tone="positive">{created} new</Badge>
                  <Badge tone="primary">{valid.length - created} updated</Badge>
                  <Badge tone={invalid.length ? "critical" : "default"}>{invalid.length} with errors</Badge>
                </Flex>
                {invalid.length > 0 && (
                  <Card padding={3} radius={2} tone="critical">
                    <Flex direction="column" gap={3}>
                      <Text weight="semibold">
                        These rows will be skipped. Fix them in the file and choose it again:
                      </Text>
                      {invalid.slice(0, 50).map((row) => (
                        <Text key={row.line} size={1}>
                          Row {row.line} ({row.label}): {row.errors.join("; ")}
                        </Text>
                      ))}
                      {invalid.length > 50 && <Text>…and {invalid.length - 50} more.</Text>}
                    </Flex>
                  </Card>
                )}
                <Flex gap={2}>
                  <Button
                    text={`Import ${valid.length} products`}
                    tone="primary"
                    onClick={runImport}
                    disabled={busy || valid.length === 0}
                  />
                  <Button text="Cancel" mode="bleed" onClick={() => setPreview(null)} disabled={busy} />
                </Flex>
              </Flex>
            )}
          </Flex>
        </Card>

        {message && (
          <Card padding={3} radius={2} tone={message.tone}>
            <Text>{message.text}</Text>
          </Card>
        )}
        <Text muted>
          Note: imports update published products directly. If a product has unpublished changes (a draft) in the
          Studio, the draft still shows there until you publish or discard it.
        </Text>
      </Flex>
    </Box>
  );
}

export const catalogCsvTool: Tool = {
  name: "catalog-csv",
  title: "Import / Export",
  icon: UploadIcon,
  component: CatalogCsvTool,
};
