declare module "@capacitor/clipboard" {
  export const Clipboard: {
    write(options: { string: string }): Promise<void>;
  };
}
