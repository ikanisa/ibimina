const ErrorUtils = {
  setGlobalHandler: () => {},
  getGlobalHandler: () => () => {},
  reportError: () => {},
  reportFatalError: () => {},
  applyWithGuard: (fn, ctx, args) => fn.apply(ctx, args || []),
  applyWithGuardIfNeeded: (fn, ctx, args) => fn.apply(ctx, args || []),
  inGuard: () => false,
};

global.ErrorUtils = ErrorUtils;

module.exports = ErrorUtils;
