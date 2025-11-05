"use client";

import { Printer } from "lucide-react";
import { Button } from "./ui/Button";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} variant="outline" leftIcon={<Printer size={20} />}>
      Print Instructions
    </Button>
  );
}
