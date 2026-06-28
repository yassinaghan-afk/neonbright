export type SignageTypeId =
  | "lettres-boitiers"
  | "enseigne-lumineuse"
  | "enseigne-led"
  | "caisson-lumineux"
  | "logo-lumineux"
  | "signaletique"
  | "totem"
  | "facade";

export type TimeOfDay = "day" | "night";

export type FacadeType = "retail" | "hotel" | "restaurant" | "office";

export type SignageState = {
  signType: SignageTypeId;
  businessName: string;
  logoUrl: string | null;
  logoFile: File | null;
  signWidthCm: number;
  signHeightCm: number;
  positionX: number;
  positionY: number;
  lightingIntensity: number;
  timeOfDay: TimeOfDay;
  facadeType: FacadeType;
};

export const INITIAL_SIGNAGE_STATE: SignageState = {
  signType: "enseigne-lumineuse",
  businessName: "VOTRE MARQUE",
  logoUrl: null,
  logoFile: null,
  signWidthCm: 180,
  signHeightCm: 60,
  positionX: 50,
  positionY: 28,
  lightingIntensity: 75,
  timeOfDay: "night",
  facadeType: "retail",
};

export type SignageSnapshot = {
  product: "commercial-signage";
  signType: SignageTypeId;
  businessName: string;
  signWidthCm: number;
  signHeightCm: number;
  positionX: number;
  positionY: number;
  lightingIntensity: number;
  timeOfDay: TimeOfDay;
  facadeType: FacadeType;
  estimatedPrice: number;
  logoFileName: string | null;
};

export function toSignageSnapshot(
  state: SignageState,
  estimatedPrice: number
): SignageSnapshot {
  return {
    product: "commercial-signage",
    signType: state.signType,
    businessName: state.businessName,
    signWidthCm: state.signWidthCm,
    signHeightCm: state.signHeightCm,
    positionX: state.positionX,
    positionY: state.positionY,
    lightingIntensity: state.lightingIntensity,
    timeOfDay: state.timeOfDay,
    facadeType: state.facadeType,
    estimatedPrice,
    logoFileName: state.logoFile?.name ?? null,
  };
}
