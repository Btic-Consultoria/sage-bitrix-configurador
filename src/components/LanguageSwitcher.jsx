import React from "react";
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="flex space-x-2">
      <button
        className={`px-2 py-1 rounded ${
          i18n.language === "en"
            ? "bg-onyx-500 text-white"
            : "bg-onyx-200 text-onyx-600"
        }`}
        onClick={() => changeLanguage("en")}
      >
        EN
      </button>
      <button
        className={`px-2 py-1 rounded ${
          i18n.language === "es"
            ? "bg-onyx-500 text-white"
            : "bg-onyx-200 text-onyx-600"
        }`}
        onClick={() => changeLanguage("es")}
      >
        ES
      </button>
      <button
        className={`px-2 py-1 rounded ${
          i18n.language === "ca"
            ? "bg-onyx-500 text-white"
            : "bg-onyx-200 text-onyx-600"
        }`}
        onClick={() => changeLanguage("ca")}
      >
        CA
      </button>
    </div>
  );
}

export default LanguageSwitcher;
