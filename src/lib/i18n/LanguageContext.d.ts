import { ReactNode } from "react";
import { Locale, TranslationKeys } from "./translations";
interface LanguageContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: TranslationKeys;
}
export declare function LanguageProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useLanguage(): LanguageContextType;
export {};
//# sourceMappingURL=LanguageContext.d.ts.map