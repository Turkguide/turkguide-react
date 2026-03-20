import { trackMetric } from "../utils/helpers";

export function useLandingFilters({ setLandingSearch, setCategoryFilter }) {
  function landingDoSearch() {
    trackMetric("search_click_total");
  }

  function pickCategory(key) {
    setCategoryFilter(key);
    setTimeout(() => {
      const el = document.getElementById("biz-list");
      el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function clearFilters() {
    setLandingSearch("");
    setCategoryFilter("");
  }

  return { landingDoSearch, pickCategory, clearFilters };
}
