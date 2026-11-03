/** A CSV download response. Never cached: these files hold private business data. */
export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export const notFoundResponse = () => new Response("Not found", { status: 404 });
