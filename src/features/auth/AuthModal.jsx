import { useState } from "react";
import { Modal, Button, inputStyle } from "../../components/ui";

/**
 * Auth Modal Component - Login and Register forms
 */
export function AuthModal({ ui, showAuth, showRegister, setShowAuth, setShowRegister, authEmail, setAuthEmail, authPassword, setAuthPassword, authUsername, setAuthUsername, loginNow, oauthLogin }) {
  const [showTermsViewer, setShowTermsViewer] = useState(false);
  const [termsViewerType, setTermsViewerType] = useState(/** @type {null | 'terms' | 'community'} */ null);

  const openTermsViewer = (type) => {
    setTermsViewerType(type);
    setShowTermsViewer(true);
  };

  const closeTermsViewer = () => {
    setShowTermsViewer(false);
    setTermsViewerType(null);
  };

  return (
    <>
      {/* LOGIN MODAL */}
      <Modal ui={ui} open={showAuth} title="Giriş / Kayıt" onClose={() => setShowAuth(false)}>
        <div style={{ color: ui.muted, marginBottom: 10 }}>
          Paylaşım, yorum, mesaj ve randevu için giriş zorunlu.
        </div>

        <input
          placeholder="Email"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          style={inputStyle(ui)}
        />

        <input
          placeholder="Şifre"
          type="password"
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          style={{ ...inputStyle(ui), marginTop: 10 }}
        />

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <Button
            ui={ui}
            variant="solidBlue"
            onClick={() => loginNow("email", "login")}
            disabled={!authEmail.trim() || !authPassword.trim()}
            style={{ width: "100%" }}
          >
            Giriş Yap
          </Button>

          <Button
            ui={ui}
            variant="blue"
            onClick={() => {
              setShowAuth(false);
              setShowRegister(true);
              setAuthUsername("");
              setAuthEmail("");
              setAuthPassword("");
            }}
            style={{ width: "100%" }}
          >
            Kayıt Ol
          </Button>

          <Button ui={ui} onClick={() => setShowAuth(false)} style={{ width: "100%" }}>
            Vazgeç
          </Button>
        </div>

        <div style={{ marginTop: 10, color: ui.muted, fontSize: 12 }}>
          Not: Güvenli giriş için doğrulama ve güvenlik kontrolleri uygulanır.
        </div>

        <div style={{ textAlign: "center", color: ui.muted, fontSize: 12, margin: "12px 0" }}>
          veya
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <Button
            ui={ui}
            onClick={() => oauthLogin("apple")}
            style={{
              width: "100%",
              background: "#000",
              color: "#fff",
              fontWeight: 900,
              borderRadius: 999,
            }}
          >
             Apple ile Giriş
          </Button>
        </div>
      </Modal>

      {/* REGISTER MODAL */}
      <Modal ui={ui} open={showRegister} title="Kayıt Ol" onClose={() => setShowRegister(false)}>
        <div style={{ color: ui.muted, marginBottom: 10 }}>
          Email, kullanıcı adı ve şifre ile hesap oluştur.
        </div>

        <input
          placeholder="Kullanıcı Adı"
          value={authUsername}
          onChange={(e) => setAuthUsername(e.target.value)}
          style={inputStyle(ui)}
        />

        <input
          placeholder="Email"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          style={{ ...inputStyle(ui), marginTop: 10 }}
        />

        <input
          placeholder="Şifre"
          type="password"
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          style={{ ...inputStyle(ui), marginTop: 10 }}
        />

        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, marginTop: 12, color: ui.muted }}>
          <span>
            <button
              type="button"
              onClick={() => openTermsViewer("terms")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: ui.text,
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Kullanım Şartları
            </button>
            {" ve "}
            <button
              type="button"
              onClick={() => openTermsViewer("community")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: ui.text,
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Topluluk Kuralları
            </button>
            sayfalarını inceleyebilirsiniz.
          </span>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <Button
            ui={ui}
            variant="solidBlue"
            onClick={() => loginNow("email", "register")}
            disabled={!authUsername.trim() || !authEmail.trim() || !authPassword.trim()}
            style={{ width: "100%" }}
          >
            Kaydı Tamamla
          </Button>

          <Button
            ui={ui}
            variant="blue"
            onClick={() => {
              setShowRegister(false);
              setShowAuth(true);
            }}
            style={{ width: "100%" }}
          >
            ← Girişe Dön
          </Button>

          <Button
            ui={ui}
            onClick={() => setShowRegister(false)}
            style={{ width: "100%" }}
          >
            Vazgeç
          </Button>
        </div>
      </Modal>

      {/* Terms / Community Guidelines viewer — in-app so user can return without losing signup data */}
      <Modal
        ui={ui}
        open={showTermsViewer}
        title={termsViewerType === "community" ? "Topluluk Kuralları" : "Kullanım Şartları"}
        onClose={closeTermsViewer}
        showBack={true}
        onBack={closeTermsViewer}
        iconClose={true}
        fullScreen={true}
        zIndex={1001}
      >
        <div
          style={{
            height: "100%",
            minHeight: 300,
          }}
        >
          <iframe
            src={termsViewerType === "terms" ? "/terms.html" : "/community-guidelines.html"}
            title={termsViewerType === "community" ? "Topluluk Kuralları" : "Kullanım Şartları"}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 300,
              border: "none",
              borderRadius: 8,
            }}
          />
        </div>
      </Modal>
    </>
  );
}
