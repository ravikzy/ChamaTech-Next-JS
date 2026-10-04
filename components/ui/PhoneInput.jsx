"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { formatPhoneBR } from "@/lib/utils";

export function PhoneInput({ defaultValue = "", ...props }) {
  const [value, setValue] = useState(formatPhoneBR(defaultValue ?? ""));
  return (
    <Input
      type="tel"
      value={value}
      onChange={(e) => setValue(formatPhoneBR(e.target.value))}
      placeholder="(11) 91234-5678"
      {...props}
    />
  );
}
