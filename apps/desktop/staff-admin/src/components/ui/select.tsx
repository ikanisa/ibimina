// Stub UI components - minimal implementations

export function Select({ value, onChange, children, className = '' }: any) {
  return (
    <select value={value} onChange={onChange} className={`px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 ${className}`}>
      {children}
    </select>
  );
}
