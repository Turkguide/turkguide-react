import { useRef } from "react";

/** Read file as base64 for avatar uploads */
export function useFileToBase64() {
  const pickRef = useRef(null);
  function pick() {
    pickRef.current?.click();
  }
  function Input({ onBase64 }) {
    return (
      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            const b64 = String(reader.result || "");
            onBase64?.(b64);
            e.target.value = "";
          };
          reader.readAsDataURL(f);
        }}
      />
    );
  }
  return { pick, Input };
}
