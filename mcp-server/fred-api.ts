/**
 * FRED API Integration
 * Federal Reserve Economic Data API for real-time economic indicators
 * Documentation: https://fred.stlouisfed.org/docs/api/fred/
 */

const FRED_BASE_URL = "https://api.stlouisfed.org/fred";

// Mortgage and economic series IDs relevant to mortgage industry
export const FRED_SERIES = {
  // Mortgage Rates
  MORTGAGE_30Y: "MORTGAGE30US",        // 30-Year Fixed Rate Mortgage Average
  MORTGAGE_15Y: "MORTGAGE15US",        // 15-Year Fixed Rate Mortgage Average
  MORTGAGE_5_1_ARM: "MORTGAGE5US",     // 5/1-Year Adjustable Rate Mortgage Average

  // Federal Reserve Rates
  FED_FUNDS_RATE: "FEDFUNDS",          // Federal Funds Effective Rate
  PRIME_RATE: "DPRIME",                // Bank Prime Loan Rate
  TREASURY_10Y: "DGS10",               // 10-Year Treasury Constant Maturity Rate
  TREASURY_5Y: "DGS5",                 // 5-Year Treasury Constant Maturity Rate

  // Inflation & Economic Indicators
  CPI: "CPIAUCSL",                     // Consumer Price Index for All Urban Consumers
  CORE_CPI: "CPILFESL",                // CPI Less Food and Energy
  PCE: "PCE",                          // Personal Consumption Expenditures
  CORE_PCE: "PCEPILFE",                // PCE Excluding Food and Energy

  // Housing Market
  HOUSING_STARTS: "HOUST",             // Housing Starts: Total New Privately Owned
  BUILDING_PERMITS: "PERMIT",          // New Private Housing Units Authorized by Building Permits
  MEDIAN_HOME_PRICE: "MSPUS",          // Median Sales Price of Houses Sold for the United States
  HOME_SALES_EXISTING: "EXHOSLUSM495S", // Existing Home Sales
  HOME_SALES_NEW: "HSN1F",             // New One Family Houses Sold
  HOUSING_INVENTORY: "MSACSR",         // Monthly Supply of Houses in the United States

  // Employment & Income
  UNEMPLOYMENT: "UNRATE",              // Unemployment Rate
  NONFARM_PAYROLL: "PAYEMS",           // All Employees: Total Nonfarm
  MEDIAN_HOUSEHOLD_INCOME: "MEHOINUSA672N", // Real Median Household Income

  // GDP & Growth
  GDP: "GDP",                          // Gross Domestic Product
  GDP_REAL: "GDPC1",                   // Real Gross Domestic Product

  // Mortgage Delinquencies & Debt
  MORTGAGE_DELINQUENCY: "DRSFRMACBS",  // Delinquency Rate on Single-Family Residential Mortgages
  HOUSEHOLD_DEBT: "TDSP",              // Households and Nonprofit Organizations; Total Debt Securities
  MORTGAGE_DEBT: "HHMSDODNS"           // Households; Home Mortgages; Liability
} as const;

type SeriesId = typeof FRED_SERIES[keyof typeof FRED_SERIES];

export interface FredObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

export interface FredSeriesResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: FredObservation[];
}

export interface FredSeriesInfo {
  id: string;
  realtime_start: string;
  realtime_end: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  notes?: string;
}

export interface FredSeriesInfoResponse {
  seriess: FredSeriesInfo[];
}

/**
 * Fetch observations (data points) for a specific series
 */
export async function fetchSeriesObservations(
  seriesId: SeriesId,
  options: {
    limit?: number;
    sortOrder?: "asc" | "desc";
    observationStart?: string;
    observationEnd?: string;
  } = {}
): Promise<FredSeriesResponse | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error("❌ FRED_API_KEY not found in environment variables");
    return null;
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: "json",
    limit: String(options.limit || 10),
    sort_order: options.sortOrder || "desc"
  });

  if (options.observationStart) {
    params.append("observation_start", options.observationStart);
  }
  if (options.observationEnd) {
    params.append("observation_end", options.observationEnd);
  }

  const url = `${FRED_BASE_URL}/series/observations?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ FRED API error: ${response.status} ${response.statusText}`);
      return null;
    }
    return (await response.json()) as FredSeriesResponse;
  } catch (error) {
    console.error("❌ Failed to fetch FRED data:", error);
    return null;
  }
}

/**
 * Get series metadata/information
 */
export async function fetchSeriesInfo(seriesId: SeriesId): Promise<FredSeriesInfo | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error("❌ FRED_API_KEY not found in environment variables");
    return null;
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: "json"
  });

  const url = `${FRED_BASE_URL}/series?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ FRED API error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = (await response.json()) as FredSeriesInfoResponse;
    return data.seriess?.[0] || null;
  } catch (error) {
    console.error("❌ Failed to fetch FRED series info:", error);
    return null;
  }
}

/**
 * Get current (most recent) value for a series
 */
export async function getCurrentValue(seriesId: SeriesId): Promise<{
  value: number;
  date: string;
  title?: string;
} | null> {
  const data = await fetchSeriesObservations(seriesId, { limit: 1, sortOrder: "desc" });
  if (!data || !data.observations || data.observations.length === 0) {
    return null;
  }

  const observation = data.observations[0];
  const value = parseFloat(observation.value);

  if (isNaN(value)) {
    return null;
  }

  return {
    value,
    date: observation.date,
  };
}

/**
 * Get mortgage rates summary (30-year and 15-year)
 */
export async function getMortgageRatesSummary(): Promise<{
  mortgage30Y: { value: number; date: string } | null;
  mortgage15Y: { value: number; date: string } | null;
  fedFundsRate: { value: number; date: string } | null;
} | null> {
  try {
    const [rate30Y, rate15Y, fedRate] = await Promise.all([
      getCurrentValue(FRED_SERIES.MORTGAGE_30Y),
      getCurrentValue(FRED_SERIES.MORTGAGE_15Y),
      getCurrentValue(FRED_SERIES.FED_FUNDS_RATE)
    ]);

    return {
      mortgage30Y: rate30Y,
      mortgage15Y: rate15Y,
      fedFundsRate: fedRate
    };
  } catch (error) {
    console.error("❌ Failed to fetch mortgage rates summary:", error);
    return null;
  }
}

/**
 * Get housing market indicators
 */
export async function getHousingMarketData(): Promise<{
  medianHomePrice: { value: number; date: string } | null;
  housingStarts: { value: number; date: string } | null;
  existingHomeSales: { value: number; date: string } | null;
} | null> {
  try {
    const [medianPrice, starts, sales] = await Promise.all([
      getCurrentValue(FRED_SERIES.MEDIAN_HOME_PRICE),
      getCurrentValue(FRED_SERIES.HOUSING_STARTS),
      getCurrentValue(FRED_SERIES.HOME_SALES_EXISTING)
    ]);

    return {
      medianHomePrice: medianPrice,
      housingStarts: starts,
      existingHomeSales: sales
    };
  } catch (error) {
    console.error("❌ Failed to fetch housing market data:", error);
    return null;
  }
}

/**
 * Get economic indicators
 */
export async function getEconomicIndicators(): Promise<{
  cpi: { value: number; date: string } | null;
  unemployment: { value: number; date: string } | null;
  gdp: { value: number; date: string } | null;
} | null> {
  try {
    const [cpi, unemployment, gdp] = await Promise.all([
      getCurrentValue(FRED_SERIES.CPI),
      getCurrentValue(FRED_SERIES.UNEMPLOYMENT),
      getCurrentValue(FRED_SERIES.GDP)
    ]);

    return {
      cpi,
      unemployment,
      gdp
    };
  } catch (error) {
    console.error("❌ Failed to fetch economic indicators:", error);
    return null;
  }
}

/**
 * Search for relevant data based on question keywords
 */
export async function searchRelevantData(question: string): Promise<string | null> {
  const lowerQuestion = question.toLowerCase();

  // Mortgage rate queries
  if (lowerQuestion.includes("mortgage rate") || lowerQuestion.includes("interest rate") || lowerQuestion.includes("current rate")) {
    const rates = await getMortgageRatesSummary();
    if (!rates) return null;

    let response = "📊 **Current Mortgage Rates (from FRED)**:\n\n";

    if (rates.mortgage30Y) {
      response += `• **30-Year Fixed**: ${rates.mortgage30Y.value}% (as of ${rates.mortgage30Y.date})\n`;
    }
    if (rates.mortgage15Y) {
      response += `• **15-Year Fixed**: ${rates.mortgage15Y.value}% (as of ${rates.mortgage15Y.date})\n`;
    }
    if (rates.fedFundsRate) {
      response += `• **Federal Funds Rate**: ${rates.fedFundsRate.value}% (as of ${rates.fedFundsRate.date})\n`;
    }

    return response;
  }

  // Housing market queries
  if (lowerQuestion.includes("home price") || lowerQuestion.includes("housing market") || lowerQuestion.includes("housing start")) {
    const housing = await getHousingMarketData();
    if (!housing) return null;

    let response = "🏠 **Housing Market Data (from FRED)**:\n\n";

    if (housing.medianHomePrice) {
      response += `• **Median Home Price**: $${housing.medianHomePrice.value.toLocaleString()} (as of ${housing.medianHomePrice.date})\n`;
    }
    if (housing.housingStarts) {
      response += `• **Housing Starts**: ${housing.housingStarts.value.toLocaleString()} units (as of ${housing.housingStarts.date})\n`;
    }
    if (housing.existingHomeSales) {
      response += `• **Existing Home Sales**: ${housing.existingHomeSales.value.toLocaleString()} (as of ${housing.existingHomeSales.date})\n`;
    }

    return response;
  }

  // Economic indicators
  if (lowerQuestion.includes("inflation") || lowerQuestion.includes("cpi") || lowerQuestion.includes("economy") || lowerQuestion.includes("unemployment")) {
    const econ = await getEconomicIndicators();
    if (!econ) return null;

    let response = "📈 **Economic Indicators (from FRED)**:\n\n";

    if (econ.cpi) {
      response += `• **CPI (Inflation)**: ${econ.cpi.value.toFixed(1)} (as of ${econ.cpi.date})\n`;
    }
    if (econ.unemployment) {
      response += `• **Unemployment Rate**: ${econ.unemployment.value}% (as of ${econ.unemployment.date})\n`;
    }
    if (econ.gdp) {
      response += `• **GDP**: $${(econ.gdp.value / 1000).toFixed(2)}T (as of ${econ.gdp.date})\n`;
    }

    return response;
  }

  return null;
}
