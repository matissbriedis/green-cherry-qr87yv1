import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "en", // default language
  fallbackLng: "en",
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: { translation: require("./locales/en/translation.json") },
    lv: { translation: require("./locales/lv/translation.json") },
    et: { translation: require("./locales/et/translation.json") },
    lt: { translation: require("./locales/lt/translation.json") },
    pl: { translation: require("./locales/pl/translation.json") },
    sv: { translation: require("./locales/sv/translation.json") },
    no: { translation: require("./locales/no/translation.json") },
    da: { translation: require("./locales/da/translation.json") },
    fi: { translation: require("./locales/fi/translation.json") },
  },
});

export default i18n;
