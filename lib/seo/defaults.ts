import type { SeoCity, SeoIndustry, SeoRegistry, SeoService } from "./types";

const kw = (...parts: string[]) => parts;

function service(
  slug: string,
  name: string,
  description: string,
  keywords: string[]
): SeoService {
  return { type: "service", slug, name, description, keywords, active: true };
}

function city(
  slug: string,
  name: string,
  region: string,
  description: string,
  keywords: string[]
): SeoCity {
  return {
    type: "city",
    slug,
    name,
    region,
    country: "Morocco",
    description,
    keywords,
    active: true,
  };
}

function industry(
  slug: string,
  name: string,
  pluralName: string,
  description: string,
  keywords: string[]
): SeoIndustry {
  return {
    type: "industry",
    slug,
    name,
    pluralName,
    description,
    keywords,
    active: true,
  };
}

export const DEFAULT_SEO_REGISTRY: SeoRegistry = {
  updatedAt: new Date().toISOString(),
  services: [
    service("custom-neon-signs", "Custom Neon Signs", "Bespoke LED neon signs tailored to your brand.", kw("custom neon signs", "bespoke neon")),
    service("logo-neon-signs", "Logo Neon Signs", "Transform your logo into premium LED neon.", kw("logo neon signs", "brand neon")),
    service("business-neon-signs", "Business Neon Signs", "Professional neon signage for businesses.", kw("business neon signs")),
    service("commercial-signage", "Commercial Signage", "High-impact commercial LED signage.", kw("commercial signage", "commercial neon")),
    service("restaurant-neon-signs", "Restaurant Neon Signs", "Eye-catching neon for restaurants and dining.", kw("restaurant neon signs")),
    service("cafe-neon-signs", "Cafe Neon Signs", "Warm, inviting neon for cafes and coffee shops.", kw("cafe neon signs")),
    service("hotel-neon-signs", "Hotel Neon Signs", "Luxury neon signage for hotels and hospitality.", kw("hotel neon signs")),
    service("retail-neon-signs", "Retail Neon Signs", "Drive foot traffic with retail neon displays.", kw("retail neon signs")),
    service("corporate-neon-signs", "Corporate Neon Signs", "Polished neon for offices and corporate spaces.", kw("corporate neon signs")),
    service("event-neon-signs", "Event Neon Signs", "Memorable neon for events and activations.", kw("event neon signs")),
    service("wedding-neon-signs", "Wedding Neon Signs", "Romantic custom neon for weddings.", kw("wedding neon signs")),
    service("acrylic-signs", "Acrylic Signs", "Premium acrylic-backed LED signage.", kw("acrylic signs", "acrylic neon")),
    service("illuminated-signs", "Illuminated Signs", "Bright illuminated business signs.", kw("illuminated signs")),
    service("led-neon-signs", "LED Neon Signs", "Energy-efficient modern LED neon.", kw("LED neon signs")),
    service("storefront-signs", "Storefront Signs", "Bold storefront neon that converts.", kw("storefront signs")),
  ],
  cities: [
    city("casablanca", "Casablanca", "Casablanca-Settat", "Morocco's economic capital.", kw("Casablanca neon signs")),
    city("rabat", "Rabat", "Rabat-Salé-Kénitra", "The capital city of Morocco.", kw("Rabat neon signs")),
    city("marrakech", "Marrakech", "Marrakech-Safi", "Tourism and hospitality hub.", kw("Marrakech neon signs")),
    city("agadir", "Agadir", "Souss-Massa", "Coastal business destination.", kw("Agadir neon signs")),
    city("tangier", "Tangier", "Tanger-Tétouan-Al Hoceïma", "Gateway to Europe.", kw("Tangier neon signs")),
    city("fes", "Fes", "Fès-Meknès", "Historic cultural center.", kw("Fes neon signs")),
    city("meknes", "Meknes", "Fès-Meknès", "Imperial city with growing retail.", kw("Meknes neon signs")),
    city("oujda", "Oujda", "Oriental", "Eastern Morocco hub.", kw("Oujda neon signs")),
    city("kenitra", "Kenitra", "Rabat-Salé-Kénitra", "Atlantic port city.", kw("Kenitra neon signs")),
    city("tetouan", "Tetouan", "Tanger-Tétouan-Al Hoceïma", "Northern medina city.", kw("Tetouan neon signs")),
  ],
  industries: [
    industry("restaurants", "Restaurant", "Restaurants", "Neon signage for restaurants.", kw("restaurant signage")),
    industry("cafes", "Cafe", "Cafes", "Neon for cafes and coffee shops.", kw("cafe signage")),
    industry("hotels", "Hotel", "Hotels", "Hospitality neon solutions.", kw("hotel signage")),
    industry("gyms", "Gym", "Gyms", "Motivational gym neon signs.", kw("gym neon signs")),
    industry("salons", "Salon", "Salons", "Beauty salon neon branding.", kw("salon neon signs")),
    industry("malls", "Mall", "Malls", "Mall and retail center signage.", kw("mall signage")),
    industry("retail-stores", "Retail Store", "Retail Stores", "Retail neon displays.", kw("retail signage")),
    industry("corporate-offices", "Corporate Office", "Corporate Offices", "Office and lobby neon.", kw("corporate signage")),
    industry("clinics", "Clinic", "Clinics", "Medical and clinic signage.", kw("clinic signage")),
    industry("real-estate", "Real Estate", "Real Estate", "Property and agency neon.", kw("real estate signage")),
  ],
};
