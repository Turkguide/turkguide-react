import { useState, useEffect, useMemo } from "react";
import { inputStyle, Button } from "../../components/ui";
import { TG_DEFAULT_CATEGORIES, TG_PHONE_CODES } from "../../constants/categories";

/**
 * Business Application Form Component
 */
export function BizApplyForm({ ui, onSubmit, onCancel, biz = [] }) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");

  // Address pieces
  const [address, setAddress] = useState("");
  const [apt, setApt] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("United States");

  // Phone
  const [phoneCode, setPhoneCode] = useState(TG_PHONE_CODES?.[0]?.dial || "+1");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Category
  const [category, setCategory] = useState(TG_DEFAULT_CATEGORIES?.[0]?.key || "");

  const [desc, setDesc] = useState("");

  // ✅ ZIP -> City / State otomatik doldurma (US)
  useEffect(() => {
    const c = String(country || "").toLowerCase().trim();
    const z = String(zip || "").trim();

    // Sadece ABD ve 5 haneli ZIP
    if (!(c === "united states" || c === "usa" || c === "us")) return;
    if (!/^\d{5}$/.test(z)) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${z}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;

        const data = await res.json();
        const place = data?.places?.[0];
        if (!place) return;

        const autoCity = place["place name"];
        const autoState = place["state"];

        // Kullanıcı elle yazmadıysa doldur
        setCity((prev) => (prev ? prev : autoCity));
        setState((prev) => (prev ? prev : autoState));
        if (!country) setCountry("United States");
      } catch (e) {
        // sessiz geç
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [zip, country]);

  // ✅ kategori listesi (default + dinamik)
  const categoryOptions = useMemo(() => {
    const base = (TG_DEFAULT_CATEGORIES || []).map((c) => c.key);

    const dyn = Array.from(
      new Set(
        (biz || [])
          .filter((b) => b?.status === "approved" && b?.category)
          .map((b) => String(b.category).trim())
      )
    );

    return [...base, ...dyn.filter((d) => !base.includes(d))];
  }, [biz]);

  const safeSubmit = () => {
    if (typeof onSubmit !== "function") {
      console.error("BizApplyForm: onSubmit function değil:", onSubmit);
      alert("Başvuru gönderme fonksiyonu bağlı değil (onSubmit).");
      return;
    }

    const dial = String(phoneCode || "").trim();
    const local = String(phoneNumber || "").trim();
    const phone = [dial, local].filter(Boolean).join(" ").trim();

    onSubmit({
      name: String(name || "").trim(),
      address1: String(address || "").trim(),
      address: String(address || "").trim(), // geriye dönük uyumluluk için kalsın
      apt: String(apt || "").trim(),
      zip: String(zip || "").trim(),
      city: String(city || "").trim(),
      state: String(state || "").trim(),
      country: String(country || "").trim(),

      phoneDial: dial,
      phoneLocal: local,
      phone,

      category: String(category || "").trim(),
      desc: String(desc || "").trim(),
    });
  };

  const safeCancel = () => {
    if (typeof onCancel !== "function") {
      console.error("BizApplyForm: onCancel function değil:", onCancel);
      return;
    }
    onCancel();
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input
        placeholder="İşletme adı"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle(ui)}
      />

      <input
        placeholder="Adres"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={inputStyle(ui)}
      />

      <input
        placeholder="Apt / Suite (opsiyonel)"
        value={apt}
        onChange={(e) => setApt(e.target.value)}
        style={inputStyle(ui)}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input
          placeholder="ZIP Code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          style={inputStyle(ui)}
        />

        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={inputStyle(ui)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input
          placeholder="State"
          value={state}
          onChange={(e) => setState(e.target.value)}
          style={inputStyle(ui)}
        />

        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={inputStyle(ui)}
        />
      </div>

      {/* 📞 Telefon */}
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
        <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} style={inputStyle(ui)}>
          {(TG_PHONE_CODES || []).map((p) => (
            <option key={p.code} value={p.dial}>
              {p.country} ({p.dial})
            </option>
          ))}
        </select>

        <input
          placeholder="Telefon numarası"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={inputStyle(ui)}
        />
      </div>

      {/* 🗂️ Kategori */}
      <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(ui)}>
        {categoryOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <textarea
        placeholder="Kısa açıklama"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        style={inputStyle(ui, { minHeight: 90 })}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button
          ui={ui}
          variant="solidBlue"
          onClick={safeSubmit}
          disabled={!name.trim() || !address.trim() || !zip.trim() || !phoneNumber.trim() || !category}
        >
          Başvuruyu Gönder
        </Button>
        <Button ui={ui} onClick={safeCancel}>
          İptal
        </Button>
      </div>
    </div>
  );
}
