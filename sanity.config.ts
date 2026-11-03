"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemas";
import { STORE_SETTINGS_ID } from "./sanity/ids";
import { catalogCsvTool } from "./sanity/tools/catalog-csv-tool";

export default defineConfig({
  name: "camera-store",
  title: "Retro Camera PH",
  basePath: "/studio",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Settings is a single document: hide it from "Create new".
    templates: (templates) => templates.filter((t) => t.schemaType !== "storeSettings"),
  },
  tools: [catalogCsvTool],
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Store settings")
              .id(STORE_SETTINGS_ID)
              .child(S.document().schemaType("storeSettings").documentId(STORE_SETTINGS_ID)),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => item.getId() !== "storeSettings"),
          ]),
    }),
  ],
});
