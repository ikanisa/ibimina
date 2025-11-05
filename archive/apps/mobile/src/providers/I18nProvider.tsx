/**
 * Internationalization provider using react-intl
 */

import { ReactNode } from "react";
import { IntlProvider } from "react-intl";
import { useAppStore } from "./store";

// Mock messages - in production, these would be loaded from locale files
const messages: Record<string, Record<string, string>> = {
  en: {
    "app.name": "Ibimina",
    "nav.home": "Home",
    "nav.pay": "Pay",
    "nav.statements": "Statements",
    "nav.offers": "Offers",
    "nav.profile": "Profile",
    "home.greeting": "Hello",
    "home.subtitle": "Track your savings in real time",
    "home.groups": "Your groups",
    "home.statements": "Recent statements",
    "button.join": "Join",
    "button.pay": "Pay",
    "button.viewAll": "View All",
  },
  rw: {
    "app.name": "Ibimina",
    "nav.home": "Ahabanza",
    "nav.pay": "Kwishyura",
    "nav.statements": "Ibyatewe",
    "nav.offers": "Ibyifuzo",
    "nav.profile": "Umwirondoro",
    "home.greeting": "Muraho neza",
    "home.subtitle": "Kurikirana amafaranga yawe mugihe nyacyo",
    "home.groups": "Amatsinda yawe",
    "home.statements": "Ibyatewe biheruka",
    "button.join": "Injira",
    "button.pay": "Ishyura",
    "button.viewAll": "Reba Byose",
  },
  fr: {
    "app.name": "Ibimina",
    "nav.home": "Accueil",
    "nav.pay": "Payer",
    "nav.statements": "Relevés",
    "nav.offers": "Offres",
    "nav.profile": "Profil",
    "home.greeting": "Bonjour",
    "home.subtitle": "Suivez vos économies en temps réel",
    "home.groups": "Vos groupes",
    "home.statements": "Relevés récents",
    "button.join": "Rejoindre",
    "button.pay": "Payer",
    "button.viewAll": "Voir Tout",
  },
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useAppStore((state) => state.locale);

  return (
    <IntlProvider locale={locale} messages={messages[locale] || messages.rw} defaultLocale="rw">
      {children}
    </IntlProvider>
  );
}
