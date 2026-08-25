import { apiRequest } from "@/lib/api/http";

export type ContactCtaConfig = {
  label?: string;
  url?: string;
};

export type PortfolioSettings = {
  slug: string;
  subdomain: string;
  previous_slug: string | null;
  is_published: boolean;
  published_at: string | null;
  contact_cta_config: ContactCtaConfig;
  cv_downloadable: boolean;
};

export type PortfolioSettingsPatch = Partial<
  Pick<PortfolioSettings, "slug" | "contact_cta_config" | "cv_downloadable">
>;

export function getPortfolioSettings(accessToken: string) {
  return apiRequest<PortfolioSettings>("/portfolio-settings", { accessToken });
}

export function updatePortfolioSettings(accessToken: string, patch: PortfolioSettingsPatch) {
  return apiRequest<PortfolioSettings>("/portfolio-settings", {
    method: "PATCH",
    body: patch,
    accessToken,
  });
}

export function publishPortfolio(accessToken: string) {
  return apiRequest<PortfolioSettings>("/portfolio-settings/publish", {
    method: "POST",
    accessToken,
  });
}

export function unpublishPortfolio(accessToken: string) {
  return apiRequest<PortfolioSettings>("/portfolio-settings/unpublish", {
    method: "POST",
    accessToken,
  });
}
