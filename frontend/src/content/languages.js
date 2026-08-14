// Kept in its own tiny module (separate from content/index.js) on purpose:
// content/index.js statically imports every content JSON file for every
// language, which is a large module. LanguagePicker.jsx is one of the few
// pages that loads eagerly (not React.lazy-loaded) since it's part of the
// very first screen, so if it imported SUPPORTED_LANGUAGES from
// content/index.js directly, that would pull the entire (huge) content
// module into the main bundle. Importing this standalone module instead
// keeps content/index.js out of the main chunk — it only gets pulled in by
// the lazy-loaded page chunks that actually need content data.
export const SUPPORTED_LANGUAGES = [
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];
