import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useTranslation("app");

  return (
    <header className="bg-white shadow flex justify-between items-center w-full px-4 sm:px-6">
      {/* Left side */}
      <h1 className="text-xl font-semibold text-gray-900 py-4">
        {t("vehDash")}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <Link 
          to="/history" 
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium"
        >
          <Clock size={20} />
          History
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
