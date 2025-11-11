/**
 * Deep Links Module
 *
 * Export all deep link functionality
 */

export {
  parseDeepLink,
  registerDeepLinkHandler,
  checkInitialDeepLink,
  generateDeepLink,
  generateCustomSchemeLink,
  type DeepLinkRoute,
  type DeepLinkHandler,
} from "./handler";
