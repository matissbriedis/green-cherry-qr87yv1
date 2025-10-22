import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    title: "Excel, XLSX, CSV, Google Sheets & Spreadsheet Bulk Distance Calculation",
    description: "Calculate distances between locations in bulk. First 10 rows free, buy more as needed!",
    start_now: "Start Now",
    toggle_language: "Toggle Language",
    features_title: "Features You Love",
    feature_supports: "Supports countries, cities, regions, postal addresses, postcodes, airport codes (IATA), what3words, coordinates.",
    feature_output: "Output: Airline distance, driving distance/duration, time difference, bearing, compass direction.",
    feature_validation: "Free input validation (duplicates & fault detection).",
    feature_no_signup: "No sign-up required—pay per use with PayPal.",
    how_it_works_title: "How It Works",
    step1: "Download the template or use your own XLSX/CSV/Google Sheet.",
    step2: "Upload your file for free validation (detects issues, shows price).",
    step3: "Buy rows via PayPal if needed (first 10 free).",
    step4: "Download full results with distances added to your sheet.",
    upload_title: "Upload Your File",
    download_template: "Download Template", // Added for the button
    pricing_title: "Pricing",
    service: "Service",
    price: "Price",
    validation_service: "Validation (duplicates & faults)",
    validation_price: "Free",
    additional_rows: "Additional Rows (per row, after 10 free)",
    additional_rows_price: "$0.10",
    buy_50_rows: "Buy 50 Rows",
    buy_50_price: "$5.00",
    buy_100_rows: "Buy 100 Rows",
    buy_100_price: "$9.00",
    footer_text: "Questions? Check",
    footer_link: "documentation",
    footer_contact: "or contact us."
  },
  sv: {
    title: "Excel, XLSX, CSV, Google Sheets och kalkylblads massavståndsberäkning",
    description: "Beräkna avstånd mellan platser i bulk. Första 10 rader gratis, köp fler vid behov!",
    start_now: "Börja nu",
    toggle_language: "Byt språk",
    features_title: "Funktioner du älskar",
    feature_supports: "Stöder länder, städer, regioner, postadresser, postnummer, flygplatskoder (IATA), what3words, koordinater.",
    feature_output: "Utskrift: Flygavstånd, köravstånd/tid, tidsdifference, bäring, kompassriktning.",
    feature_validation: "Gratis inmatningsvalidering (dubbletter & felidentifiering).",
    feature_no_signup: "Ingen registrering krävs — betala med PayPal.",
    how_it_works_title: "Hur det fungerar",
    step1: "Ladda ner mallen eller använd din egen XLSX/CSV/Google Sheet.",
    step2: "Ladda upp din fil för gratis validering (identifierar problem, visar pris).",
    step3: "Köp rader via PayPal vid behov (första 10 gratis).",
    step4: "Ladda ner fullständiga resultat med tillagda avstånd i ditt blad.",
    upload_title: "Ladda upp din fil",
    download_template: "Ladda ner mall", // Swedish translation
    pricing_title: "Prissättning",
    service: "Tjänst",
    price: "Pris",
    validation_service: "Validering (dubbletter & fel)",
    validation_price: "Gratis",
    additional_rows: "Ytterligare rader (per rad, efter 10 gratis)",
    additional_rows_price: "$0.10",
    buy_50_rows: "Köp 50 rader",
    buy_50_price: "$5.00",
    buy_100_rows: "Köp 100 rader",
    buy_100_price: "$9.00",
    footer_text: "Frågor? Kolla",
    footer_link: "dokumentation",
    footer_contact: "eller kontakta oss."
  },
  no: {
    title: "Excel, XLSX, CSV, Google Sheets og regneark masseavstandsberegning",
    description: "Beregn avstander mellom steder i bulk. Første 10 rader gratis, kjøp flere ved behov!",
    start_now: "Start nå",
    toggle_language: "Bytt språk",
    features_title: "Funksjoner du elsker",
    feature_supports: "Støtter land, byer, regioner, postadresser, postkoder, flyplasskoder (IATA), what3words, koordinater.",
    feature_output: "Utdata: Flyavstand, kjøreavstand/varighet, tidsskilnad, bærende, kompassretning.",
    feature_validation: "Gratis inndatavalidering (duplikater & feiloppdaging).",
    feature_no_signup: "Ingen registrering kreves — betal med PayPal.",
    how_it_works_title: "Hvordan det fungerer",
    step1: "Last ned malen eller bruk din egen XLSX/CSV/Google Sheet.",
    step2: "Last opp filen for gratis validering (oppdager problemer, viser pris).",
    step3: "Kjøp rader via PayPal om nødvendig (første 10 gratis).",
    step4: "Last ned fullstendige resultater med tilføyde avstander i arket ditt.",
    upload_title: "Last opp filen din",
    download_template: "Last ned mal", // Norwegian translation
    pricing_title: "Prising",
    service: "Tjeneste",
    price: "Pris",
    validation_service: "Validering (duplikater & feil)",
    validation_price: "Gratis",
    additional_rows: "Ekstra rader (per rad, etter 10 gratis)",
    additional_rows_price: "$0.10",
    buy_50_rows: "Kjøp 50 rader",
    buy_50_price: "$5.00",
    buy_100_rows: "Kjøp 100 rader",
    buy_100_price: "$9.00",
    footer_text: "Spørsmål? Sjekk",
    footer_link: "dokumentasjon",
    footer_contact: "eller kontakt oss."
  },
  da: {
    title: "Excel, XLSX, CSV, Google Sheets og regnearks masseafstandsberigning",
    description: "Beregn afstande mellem steder i bulk. De første 10 rækker er gratis, køb flere efter behov!",
    start_now: "Start nu",
    toggle_language: "Skift sprog",
    features_title: "Funktioner, du elsker",
    feature_supports: "Understøtter lande, byer, regioner, postadresser, postnumre, lufthavnskoder (IATA), what3words, koordinater.",
    feature_output: "Uddata: Flyafstand, køreaflstand/varighed, tidsforskel, bærende, kompasretning.",
    feature_validation: "Gratis inputvalidering (duplikater & fejlopsætning).",
    feature_no_signup: "Ingen registrering kræves — betal med PayPal.",
    how_it_works_title: "Hvordan det virker",
    step1: "Download skabelonen eller brug din egen XLSX/CSV/Google Sheet.",
    step2: "Upload din fil til gratis validering (opdager problemer, viser pris).",
    step3: "Køb rækker via PayPal, hvis nødvendigt (de første 10 gratis).",
    step4: "Download fulde resultater med tilføjede afstande i dit ark.",
    upload_title: "Upload din fil",
    download_template: "Download skabelon", // Danish translation
    pricing_title: "Priser",
    service: "Tjeneste",
    price: "Pris",
    validation_service: "Validering (duplikater & fejl)",
    validation_price: "Gratis",
    additional_rows: "Yderligere rækker (pr. række, efter 10 gratis)",
    additional_rows_price: "$0.10",
    buy_50_rows: "Køb 50 rækker",
    buy_50_price: "$5.00",
    buy_100_rows: "Køb 100 rækker",
    buy_100_price: "$9.00",
    footer_text: "Spørgsmål? Tjek",
    footer_link: "dokumentation",
    footer_contact: "eller kontakt os."
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default language
    fallbackLng: "en", // Fallback to English if language not available
    interpolation: { escapeValue: false }, // No need to escape values in React
    debug: true, // Enable debug logs to troubleshoot toggle issues
  });

export default i18n;