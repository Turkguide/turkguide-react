import { Modal } from "../ui";

const INFO_TITLES = {
  about: "Hakkımızda",
  help: "Yardım",
  privacy: "Gizlilik",
  terms: "Kullanım Şartları",
  contact: "İletişim",
};

function renderInfoPage(page) {
  if (page === "about") {
    return (
      <div style={{ display: "grid", gap: 12, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 950 }}>What we do</div>
        <div>
          TurkGuide helps users and businesses stay connected by making Turkish
          businesses and professionals easier to discover.
        </div>

        <div style={{ fontWeight: 950 }}>Community-first</div>
        <div>
          Listings and community content are provided for convenience. TurkGuide
          does not guarantee accuracy, availability, or outcomes.
        </div>

        <div style={{ fontWeight: 950 }}>No professional advice</div>
        <div>
          Content on TurkGuide is not legal, medical, financial, or other
          professional advice. Always confirm details directly with the
          business/provider.
        </div>
      </div>
    );
  }

  if (page === "help") {
    return (
      <div style={{ display: "grid", gap: 12, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 950 }}>Getting started</div>
        <div>
          Use Search or Categories to discover businesses. In HUB, you can share
          posts and interact with the community.
        </div>

        <div style={{ fontWeight: 950 }}>Support</div>
        <div>
          If something looks wrong, contact us and include screenshots and your
          username (if available).
        </div>
      </div>
    );
  }

  if (page === "privacy") {
    return (
      <div style={{ display: "grid", gap: 12, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 950 }}>Data we may process</div>
        <div>
          We may process account information (such as email and username),
          content you submit (posts, comments, business applications), and basic
          technical data needed to operate the app.
        </div>

        <div style={{ fontWeight: 950 }}>Your choices</div>
        <div>
          You can request support regarding your account or content via the
          Contact section. We do not sell personal information.
        </div>

        <div style={{ opacity: 0.7, fontSize: 12 }}>
          This is a short, non-binding summary for in-app UI only.
        </div>
      </div>
    );
  }

  if (page === "terms") {
    return (
      <div style={{ display: "grid", gap: 12, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 950 }}>Using TurkGuide</div>
        <div>
          By using TurkGuide, you agree to use the app lawfully and respectfully,
          and not to post prohibited or harmful content.
        </div>

        <div style={{ fontWeight: 950 }}>No warranties</div>
        <div>TurkGuide is provided "as is" and "as available" without warranties.</div>

        <div style={{ opacity: 0.7, fontSize: 12 }}>
          This is a short, non-binding summary for in-app UI only.
        </div>
      </div>
    );
  }

  if (page === "contact") {
    return (
      <div style={{ display: "grid", gap: 12, lineHeight: 1.6 }}>
        <div>📧 Email: info@turkguide.net</div>
        <div>🌐 Web: www.turkguide.net</div>
        <div>🐦 X (Twitter): @Turk_Guide</div>
        <div>📷 Instagram: @turkguideusa</div>
      </div>
    );
  }

  return null;
}

export function InfoModal({ ui, infoPage, setInfoPage }) {
  return (
    <Modal
      ui={ui}
      open={!!infoPage}
      title={(INFO_TITLES && infoPage && INFO_TITLES[infoPage]) || "Info"}
      onClose={() => setInfoPage(null)}
      width={760}
    >
      <div
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          paddingRight: 6,
        }}
      >
        {typeof renderInfoPage === "function" ? renderInfoPage(infoPage) : null}
      </div>
    </Modal>
  );
}
