import Database from "better-sqlite3";

import type { Quote } from "./quote";
import { initSchema } from "./schema";

type QuoteRow = Quote & { id: number };

type LatestQuotesFilter = Partial<Pick<Quote, "brand" | "face_value" | "region">>;

type QuoteHistoryParams = Pick<Quote, "brand" | "face_value" | "region"> & {
  from?: string;
  to?: string;
};

function rowToQuote(row: QuoteRow): Quote {
  return {
    brand: row.brand,
    face_value: row.face_value,
    face_currency: row.face_currency,
    region: row.region,
    price_rub: row.price_rub,
    price_rub_was: row.price_rub_was,
    discount_pct: row.discount_pct,
    source: row.source,
    source_url: row.source_url,
    fetched_at: row.fetched_at,
  };
}

export class QuoteRepository {
  private readonly db: Database.Database;

  constructor(dbPath: string = ":memory:") {
    this.db = new Database(dbPath);
    initSchema(this.db);
  }

  saveQuotes(quotes: Quote[]): void {
    const insert = this.db.prepare(`
      INSERT INTO quotes (
        brand,
        face_value,
        face_currency,
        region,
        price_rub,
        price_rub_was,
        discount_pct,
        source,
        source_url,
        fetched_at
      ) VALUES (
        @brand,
        @face_value,
        @face_currency,
        @region,
        @price_rub,
        @price_rub_was,
        @discount_pct,
        @source,
        @source_url,
        @fetched_at
      )
    `);

    const insertMany = this.db.transaction((items: Quote[]) => {
      for (const quote of items) {
        insert.run(quote);
      }
    });

    insertMany(quotes);
  }

  getLatestQuotes(filter: LatestQuotesFilter = {}): Quote[] {
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (filter.brand !== undefined) {
      conditions.push("brand = @brand");
      params.brand = filter.brand;
    }
    if (filter.face_value !== undefined) {
      conditions.push("face_value = @face_value");
      params.face_value = filter.face_value;
    }
    if (filter.region !== undefined) {
      conditions.push("region = @region");
      params.region = filter.region;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT q.*
      FROM quotes q
      INNER JOIN (
        SELECT brand, face_value, region, source, MAX(fetched_at) AS max_fetched_at
        FROM quotes
        ${whereClause}
        GROUP BY brand, face_value, region, source
      ) latest
        ON q.brand = latest.brand
       AND q.face_value = latest.face_value
       AND q.region = latest.region
       AND q.source = latest.source
       AND q.fetched_at = latest.max_fetched_at
      ORDER BY q.brand, q.face_value, q.region, q.source
    `;

    const rows = this.db.prepare(sql).all(params) as QuoteRow[];
    return rows.map(rowToQuote);
  }

  getBestQuotes(brand: string): Quote[] {
    const latest = this.getLatestQuotes({ brand });
    const bestByKey = new Map<string, Quote>();

    for (const quote of latest) {
      const key = `${quote.face_value}\0${quote.region}`;
      const current = bestByKey.get(key);

      if (
        !current ||
        quote.price_rub < current.price_rub ||
        (quote.price_rub === current.price_rub &&
          quote.source.localeCompare(current.source) < 0)
      ) {
        bestByKey.set(key, quote);
      }
    }

    return Array.from(bestByKey.values()).sort((a, b) => {
      if (a.face_value !== b.face_value) {
        return a.face_value - b.face_value;
      }
      return a.region.localeCompare(b.region);
    });
  }

  getSourceLastFetchedAt(): Array<{
    source: string;
    last_fetched_at: string;
  }> {
    const rows = this.db
      .prepare(
        `
        SELECT source, MAX(fetched_at) AS last_fetched_at
        FROM quotes
        GROUP BY source
      `,
      )
      .all() as Array<{ source: string; last_fetched_at: string }>;

    return rows;
  }

  getQuoteHistory(params: QuoteHistoryParams): Quote[] {
    const conditions = [
      "brand = @brand",
      "face_value = @face_value",
      "region = @region",
    ];
    const queryParams: Record<string, string | number> = {
      brand: params.brand,
      face_value: params.face_value,
      region: params.region,
    };

    if (params.from !== undefined) {
      conditions.push("fetched_at >= @from");
      queryParams.from = params.from;
    }
    if (params.to !== undefined) {
      conditions.push("fetched_at <= @to");
      queryParams.to = params.to;
    }

    const sql = `
      SELECT *
      FROM quotes
      WHERE ${conditions.join(" AND ")}
      ORDER BY fetched_at ASC, source ASC
    `;

    const rows = this.db.prepare(sql).all(queryParams) as QuoteRow[];
    return rows.map(rowToQuote);
  }

  close(): void {
    this.db.close();
  }
}
