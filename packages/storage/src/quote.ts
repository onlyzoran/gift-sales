export type Quote = {
  brand: string;
  face_value: number;
  face_currency: string;
  region: string;
  price_rub: number;
  price_rub_was: number | null;
  discount_pct: number | null;
  source: string;
  source_url: string | null;
  fetched_at: string;
};
