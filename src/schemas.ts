import { z } from "zod";

// The inputs of the tools. They mirror the request schemas of Vereel's public
// API (spec/openapi.json), so a mistake is caught here with a clear message
// instead of costing a round trip. test/spec-drift.test.ts compares them with
// that definition field by field; `npm run sync-spec` refreshes it.

export const PLATFORMS = ["instagram", "tiktok", "youtube", "x"] as const;
export const OFFER_TYPES = ["PRODUCT", "SERVICE", "EVENT"] as const;
export const LANGUAGES = ["pl", "en"] as const;
export const CURRENCIES = ["PLN", "EUR"] as const;
export const PUBLICATION_DURATIONS = ["DAYS_30", "DAYS_60", "DAYS_90", "PERMANENT"] as const;
export const FOLLOWER_MINIMUMS = [1000, 2000, 5000, 10000, 25000, 50000, 100000] as const;
export const GENDERS = ["WOMEN", "MEN", "OTHER"] as const;
export const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;

const text = (max: number) => z.string().trim().max(max);
const money = z.number().min(0).max(1_000_000);
const pieces = z.number().int().min(0).max(50);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "a date as YYYY-MM-DD");
const offerId = z.string().trim().min(1).max(100).describe("The offer's id, as returned by vereel_create_offer or vereel_list_my_offers");

const deliverables = z
  .strictObject({
    reels: pieces.optional(),
    posts: pieces.optional(),
    carousels: pieces.optional(),
    stories: pieces.optional(),
  })
  .describe("How many pieces of each kind the creator publishes");

const audience = z
  .strictObject({
    genders: z.array(z.enum(GENDERS)).max(GENDERS.length).optional().describe("Audience genders. Empty or absent means any."),
    ageGroups: z.array(z.enum(AGE_GROUPS)).max(AGE_GROUPS.length).optional().describe("Audience age groups (adults only). Empty or absent means any."),
    cities: z.array(text(80).min(1)).max(20).optional().describe("Audience cities. Empty or absent means anywhere."),
  })
  .describe("Who the creator's audience should be");

const followerMinimum = z
  .union(FOLLOWER_MINIMUMS.map((n) => z.literal(n)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]])
  .describe(`Smallest follower count a creator needs; one of ${FOLLOWER_MINIMUMS.join(", ")}`);

// Every field an offer can carry. Creating needs some of them; changing takes any.
const fields = {
  name: text(120).min(1).describe("Campaign name shown to creators"),
  description: text(5000).min(1).describe("What the campaign is about and what the creator does"),
  offerType: z.enum(OFFER_TYPES).describe("PRODUCT, SERVICE or EVENT"),
  language: z.enum(LANGUAGES).describe("Language of the campaign; defaults to the brand's language"),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(PLATFORMS.length).describe("Where the creator publishes: instagram, tiktok, youtube, x"),
  categoryIds: z.array(z.guid()).min(1).max(3).describe("Up to 3 category ids from vereel_list_categories"),
  isPayment: z.boolean().describe("The creator is paid"),
  isBarter: z.boolean().describe("The creator receives a product or service instead of (or besides) money"),
  productIncluded: z.boolean().describe("A paid offer also includes a product or service. Always true for barter."),
  productServiceValue: money.describe("Value of the product or service the creator receives"),
  additionalPayment: money.describe("Cash paid to the creator"),
  currency: z.enum(CURRENCIES).describe("PLN or EUR; defaults to the brand's currency"),
  deliverables,
  textProvidedByBrand: z.boolean().describe("The brand supplies the post text"),
  hashtagsProvidedByBrand: z.boolean().describe("The brand supplies the hashtags"),
  includedDescription: text(2000).describe("What the creator receives. Required when a product, service or tickets are included."),
  publicationDuration: z.enum(PUBLICATION_DURATIONS).describe("How long the post stays online; default DAYS_30"),
  logisticsRequired: z.boolean().describe("Something must be sent or arranged before the creator can start; default true"),
  requiresGoodsShipping: z.boolean().describe("The brand ships goods to the creator"),
  requiresPhysicalPresence: z.boolean().describe("The creator must be somewhere in person"),
  presenceAddress: text(300),
  presenceStartDate: isoDate,
  presenceEndDate: isoDate,
  eventPlace: text(300).describe("EVENT only: where it takes place"),
  eventDateTime: z.iso.datetime({ offset: true }).describe("EVENT only: when it starts, ISO 8601"),
  ticketsIncluded: z.boolean().describe("EVENT only: the creator receives tickets or entry"),
  applyByDays: z.number().int().min(1).max(365).describe("Creators can apply for this many days after the offer goes live; default 21"),
  followerMinimum,
  expectedAudience: text(500).describe("Free-text description of the audience wanted"),
  audience,
  remarks: text(2000).describe("Anything else creators should know"),
};

const trackingUrl = text(2048).describe("Page that the creators' tracking links lead to; enables tracking links");

// ── tool inputs ──────────────────────────────────────────────────────────────

export const createOfferShape = {
  name: fields.name,
  description: fields.description,
  offerType: fields.offerType,
  platforms: fields.platforms,
  categoryIds: fields.categoryIds,
  isPayment: fields.isPayment,
  isBarter: fields.isBarter,
  language: fields.language.optional(),
  productIncluded: fields.productIncluded.optional(),
  productServiceValue: fields.productServiceValue.optional(),
  additionalPayment: fields.additionalPayment.optional(),
  currency: fields.currency.optional(),
  deliverables: fields.deliverables.optional(),
  textProvidedByBrand: fields.textProvidedByBrand.optional(),
  hashtagsProvidedByBrand: fields.hashtagsProvidedByBrand.optional(),
  includedDescription: fields.includedDescription.optional(),
  publicationDuration: fields.publicationDuration.optional(),
  logisticsRequired: fields.logisticsRequired.optional(),
  requiresGoodsShipping: fields.requiresGoodsShipping.optional(),
  requiresPhysicalPresence: fields.requiresPhysicalPresence.optional(),
  presenceAddress: fields.presenceAddress.optional(),
  presenceStartDate: fields.presenceStartDate.optional(),
  presenceEndDate: fields.presenceEndDate.optional(),
  eventPlace: fields.eventPlace.optional(),
  eventDateTime: fields.eventDateTime.optional(),
  ticketsIncluded: fields.ticketsIncluded.optional(),
  applyByDays: fields.applyByDays.optional(),
  followerMinimum: fields.followerMinimum.optional(),
  expectedAudience: fields.expectedAudience.optional(),
  audience: fields.audience.optional(),
  trackingUrl: trackingUrl.optional(),
  remarks: fields.remarks.optional(),
  imageUrls: z
    .array(text(2048))
    .max(6)
    .optional()
    .describe("Up to 6 https image URLs Vereel downloads (JPEG, PNG or WebP, ≤ 5 MB each). The first is the cover."),
};

export const updateOfferShape = {
  offerId,
  name: fields.name.optional(),
  description: fields.description.optional(),
  offerType: fields.offerType.optional(),
  language: fields.language.optional(),
  platforms: fields.platforms.optional(),
  categoryIds: fields.categoryIds.optional(),
  isPayment: fields.isPayment.optional(),
  isBarter: fields.isBarter.optional(),
  productIncluded: fields.productIncluded.optional(),
  productServiceValue: fields.productServiceValue.optional(),
  additionalPayment: fields.additionalPayment.optional(),
  currency: fields.currency.optional(),
  deliverables: fields.deliverables.optional(),
  textProvidedByBrand: fields.textProvidedByBrand.optional(),
  hashtagsProvidedByBrand: fields.hashtagsProvidedByBrand.optional(),
  includedDescription: fields.includedDescription.optional(),
  publicationDuration: fields.publicationDuration.optional(),
  logisticsRequired: fields.logisticsRequired.optional(),
  requiresGoodsShipping: fields.requiresGoodsShipping.optional(),
  requiresPhysicalPresence: fields.requiresPhysicalPresence.optional(),
  presenceAddress: fields.presenceAddress.optional(),
  presenceStartDate: fields.presenceStartDate.optional(),
  presenceEndDate: fields.presenceEndDate.optional(),
  eventPlace: fields.eventPlace.optional(),
  eventDateTime: fields.eventDateTime.optional(),
  ticketsIncluded: fields.ticketsIncluded.optional(),
  applyByDays: fields.applyByDays.optional(),
  followerMinimum: fields.followerMinimum.optional(),
  expectedAudience: fields.expectedAudience.optional(),
  audience: fields.audience.optional(),
  trackingUrl: z.union([text(2048), z.null()]).optional().describe("A page to lead to, or null to switch tracking links off"),
  remarks: fields.remarks.optional(),
  photos: z
    .array(z.url())
    .max(6)
    .optional()
    .describe("The offer's current photo URLs in the new order; leaving one out removes it. The first is the cover."),
};

export const searchOffersShape = {
  q: z.string().trim().max(100).optional().describe("Words in the name or description"),
  category: z.guid().optional().describe("A category id from vereel_list_categories"),
  offerType: z.enum(OFFER_TYPES).optional(),
  platform: z.enum(PLATFORMS).optional(),
  language: z.enum(LANGUAGES).optional(),
  cursor: z.string().max(200).optional().describe("The nextCursor of the previous page"),
  limit: z.number().int().min(1).max(50).optional().describe("Items per page, 1–50, default 20"),
};

export const getOfferShape = {
  offerId: z.string().trim().min(1).max(100).describe("The offer's id or numeric id"),
};

export const listMyOffersShape = {
  cursor: z.string().max(200).optional().describe("The nextCursor of the previous page"),
  limit: z.number().int().min(1).max(50).optional().describe("Items per page, 1–50, default 20"),
};

export const getMyOfferShape = { offerId };

export const addImageShape = {
  offerId,
  imageUrl: z.string().trim().max(2048).optional().describe("An https:// URL of a JPEG, PNG or WebP of at most 5 MB, which Vereel downloads"),
  filePath: z
    .string()
    .trim()
    .min(1)
    .max(1024)
    .optional()
    .describe("Path of a JPEG, PNG or WebP of at most 5 MB on the machine this server runs on"),
};

export const addImageSchema = z.strictObject(addImageShape).refine((v) => (v.imageUrl !== undefined) !== (v.filePath !== undefined), {
  message: "Give exactly one of imageUrl or filePath",
});
