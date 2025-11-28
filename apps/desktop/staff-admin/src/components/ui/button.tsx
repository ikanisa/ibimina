// Stub UI components - minimal implementations

export function Button({ children, className = '', onClick, disabled, type = 'button' }: any) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
