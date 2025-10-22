import React, { useState, Suspense } from "react";
import UploadComponent from "./UploadComponent";
import "./Landing.css";

function App() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "en");

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="app">
      <div
        className="language-section"
        style={{ padding: "20px", textAlign: "center" }}
      >
        <label htmlFor="language-select" className="language-label">
          {t("toggle_language")}:
        </label>
        <select
          id="language-select"
          value={language}
          onChange={handleLanguageChange}
          className="language-select"
        >
          <option value="en">English</option>
          <option value="lv">Latviešu</option>
          <option value="et">Eesti</option>
          <option value="lt">Lietuvių</option>
          <option value="pl">Polski</option>
          <option value="sv">Svenska</option>
          <option value="no">Norsk</option>
          <option value="da">Dansk</option>
          <option value="fi">Suomi</option>
        </select>
      </div>

      <header className="hero">
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
        <button
          className="cta-button"
          onClick={() =>
            document.getElementById("upload-section").scrollIntoView()
          }
        >
          {t("start_now")}
        </button>
      </header>

      <section className="features">
        <h2>{t("features_title")}</h2>
        <ul>
          <li>{t("feature_supports")}</li>
          <li>{t("feature_output")}</li>
          <li>{t("feature_validation")}</li>
          <li>{t("feature_no_signup")}</li>
        </ul>
      </section>

      <section className="how-it-works">
        <h2>{t("how_it_works_title")}</h2>
        <ol>
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
          <li>{t("step4")}</li>
        </ol>
      </section>

      <section id="upload-section" className="upload-section">
        <h2>{t("upload_title")}</h2>
        <UploadComponent />
      </section>

      <section className="pricing">
        <h2>{t("pricing_title")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("service")}</th>
              <th>{t("price")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t("validation_service")}</td>
              <td>{t("validation_price")}</td>
            </tr>
            <tr>
              <td>{t("additional_rows")}</td>
              <td>{t("additional_rows_price")}</td>
            </tr>
            <tr>
              <td>{t("buy_50_rows")}</td>
              <td>{t("buy_50_price")}</td>
            </tr>
            <tr>
              <td>{t("buy_100_rows")}</td>
              <td>{t("buy_100_price")}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer>
        <p>
          {t("footer_text")}{" "}
          <a href="https://docs.distance.tools/tools/spreadsheet">
            {t("footer_link")}
          </a>{" "}
          {t("footer_contact")}
        </p>
      </footer>
    </div>
  );
}

export default App;
