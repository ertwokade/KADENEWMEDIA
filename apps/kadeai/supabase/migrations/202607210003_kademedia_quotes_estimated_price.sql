-- kade_quotes.estimated_price eksikti — admin panelinde quote.estimatedPrice
-- olarak gösteriliyor (muhtemelen admin tarafından elle girilen bir tahmini
-- tutar), ilk şema taslağında gözden kaçmış.
ALTER TABLE public.kade_quotes
  ADD COLUMN IF NOT EXISTS estimated_price NUMERIC(12,2);
