import { Schema, model, type Document } from "mongoose";
import { baseSchemaOptions } from "./_base";

export interface TutorialVideos {
  urduDesktop: string;
  urduMobile: string;
  englishDesktop: string;
  englishMobile: string;
}

export interface HomeSettingsDoc extends Document {
  key: "home";
  categoryRows: Partial<Record<string, number>>;
  defaultRows: number;
  tutorialVideos: TutorialVideos;
}

const homeSettingsSchema = new Schema<HomeSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: "home" },
    categoryRows: { type: Schema.Types.Mixed, default: {} },
    defaultRows: { type: Number, default: 1, min: 1, max: 5 },
    tutorialVideos: {
      type: new Schema({
        urduDesktop:    { type: String, default: "" },
        urduMobile:     { type: String, default: "" },
        englishDesktop: { type: String, default: "" },
        englishMobile:  { type: String, default: "" },
      }),
      default: () => ({ urduDesktop: "", urduMobile: "", englishDesktop: "", englishMobile: "" }),
    },
  },
  baseSchemaOptions
);

export const HomeSettings = model<HomeSettingsDoc>("HomeSettings", homeSettingsSchema);

const DEFAULT_VIDEOS: TutorialVideos = { urduDesktop: "", urduMobile: "", englishDesktop: "", englishMobile: "" };

export async function getHomeSettingsData() {
  const doc = await HomeSettings.findOne({ key: "home" }).lean();
  return {
    categoryRows:    (doc?.categoryRows ?? {}) as Record<string, number>,
    defaultRows:     doc?.defaultRows ?? 1,
    tutorialVideos:  (doc?.tutorialVideos ?? DEFAULT_VIDEOS) as TutorialVideos,
  };
}
