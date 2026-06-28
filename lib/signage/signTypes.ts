import type { SignageTypeId } from "./types";

export type SignTypeOption = {
  id: SignageTypeId;
  label: string;
  shortLabel: string;
  description: string;
};

export const SIGN_TYPE_OPTIONS: SignTypeOption[] = [
  {
    id: "lettres-boitiers",
    label: "Lettres boîtiers 3D",
    shortLabel: "Boîtiers 3D",
    description: "Lettres en relief avec éclairage interne — impact premium en façade.",
  },
  {
    id: "enseigne-lumineuse",
    label: "Enseigne lumineuse",
    shortLabel: "Lumineuse",
    description: "Panneau commercial illuminé pour vitrines et devantures.",
  },
  {
    id: "enseigne-led",
    label: "Enseigne LED",
    shortLabel: "LED",
    description: "Technologie LED haute luminosité, faible consommation.",
  },
  {
    id: "caisson-lumineux",
    label: "Caisson lumineux",
    shortLabel: "Caisson",
    description: "Lightbox rétro-éclairé pour visibilité jour et nuit.",
  },
  {
    id: "logo-lumineux",
    label: "Logo lumineux",
    shortLabel: "Logo",
    description: "Reproduction fidèle de votre logo en version illuminée.",
  },
  {
    id: "signaletique",
    label: "Signalétique commerciale",
    shortLabel: "Signalétique",
    description: "Identification claire pour commerces et espaces publics.",
  },
  {
    id: "totem",
    label: "Totem publicitaire",
    shortLabel: "Totem",
    description: "Structure verticale pour centres commerciaux et parkings.",
  },
  {
    id: "facade",
    label: "Enseigne façade",
    shortLabel: "Façade",
    description: "Grand format architectural intégré à la devanture.",
  },
];

export const FACADE_OPTIONS = [
  { id: "retail" as const, label: "Commerce / Boutique" },
  { id: "restaurant" as const, label: "Restaurant" },
  { id: "hotel" as const, label: "Hôtel" },
  { id: "office" as const, label: "Bureau / Corporate" },
];
