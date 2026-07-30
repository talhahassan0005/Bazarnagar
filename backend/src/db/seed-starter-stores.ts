/**
 * Seeds 6 realistic sample sellers/stores (with products) on the free
 * (Starter) plan, so banner ads can be checked across multiple shop pages.
 * Additive only — never deletes existing data; safe to run against a live
 * database. Run with: `npx tsx src/db/seed-starter-stores.ts`
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./connect";
import { env } from "../config/env";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/1600/500`;
const logo = (slug: string) => `${env.appUrl.replace(/\/$/, "")}/logos/${slug}.svg`;
const PASSWORD = "password123";

interface SeedProduct {
  name: string;
  price: number;
  discountPrice?: number;
  description: string;
  tags: string[];
  imgSeed: string;
  negotiable?: boolean;
}

interface SeedStore {
  name: string;
  slug: string;
  category: string;
  city: string;
  area: string;
  desc: string;
  whatsapp: string;
  instagram?: string;
  headline: string;
  tagline: string;
  theme: "brand" | "emerald" | "rose" | "amber" | "dark";
  deliveryInfo: string;
  paymentInfo: string;
  products: SeedProduct[];
}

const STORES: SeedStore[] = [
  {
    name: "Falak Kirana Store",
    slug: "falak-kirana",
    category: "Grocery",
    city: "Lahore",
    area: "Model Town",
    desc: "Neighbourhood grocery store for daily essentials — rice, flour, oil, spices and more, at fair prices.",
    whatsapp: "0300-1110001",
    headline: "Your daily groceries, delivered fresh",
    tagline: "Rice, atta, oil, spices and household essentials — all in one place.",
    theme: "emerald",
    deliveryInfo: "Same-day delivery within Model Town & nearby areas.",
    paymentInfo: "Cash on Delivery",
    products: [
      { name: "Basmati Rice 5kg", price: 1450, description: "Premium long-grain basmati rice, aged for extra aroma.", tags: ["rice", "grocery", "basmati"], imgSeed: "kirana-rice" },
      { name: "Cooking Oil 5L", price: 2650, discountPrice: 2499, description: "Pure sunflower cooking oil, 5 litre tin.", tags: ["oil", "cooking", "grocery"], imgSeed: "kirana-oil" },
      { name: "Wheat Flour (Atta) 10kg", price: 1350, description: "Stone-ground whole wheat atta, 10kg bag.", tags: ["atta", "flour", "grocery"], imgSeed: "kirana-atta" },
      { name: "Tea Pack 900g", price: 850, description: "Strong, aromatic black tea leaves.", tags: ["tea", "grocery", "beverages"], imgSeed: "kirana-tea" },
      { name: "Sugar 10kg", price: 1650, description: "Fine white refined sugar, 10kg bag.", tags: ["sugar", "grocery"], imgSeed: "kirana-sugar" },
      { name: "Red Lentils (Masoor Daal) 1kg", price: 420, description: "Cleaned and sorted red lentils, 1kg pack.", tags: ["daal", "lentils", "grocery"], imgSeed: "kirana-daal" },
      { name: "Iodized Salt 800g", price: 90, description: "Fine iodized table salt, 800g pack.", tags: ["salt", "grocery"], imgSeed: "kirana-salt" },
      { name: "Red Chili Powder 200g", price: 260, description: "Freshly ground red chili powder.", tags: ["spices", "chili", "grocery"], imgSeed: "kirana-chili" },
      { name: "Assorted Spice Pack (5 items)", price: 780, discountPrice: 699, description: "Turmeric, coriander, cumin, garam masala & black pepper set.", tags: ["spices", "masala", "grocery"], imgSeed: "kirana-spices" },
    ],
  },
  {
    name: "Zain Mobile Accessories",
    slug: "zain-mobile-accessories",
    category: "Electronics",
    city: "Karachi",
    area: "Gulshan-e-Iqbal",
    desc: "Phone cases, chargers, cables and accessories for all major phone brands — genuine quality, best prices.",
    whatsapp: "0300-1110002",
    instagram: "zain.mobileaccessories",
    headline: "Phone accessories that actually last",
    tagline: "Cases, chargers, cables and more — for every phone, every budget.",
    theme: "brand",
    deliveryInfo: "Delivery across Karachi within 24 hours.",
    paymentInfo: "COD / EasyPaisa / JazzCash",
    products: [
      { name: "Silicone Phone Case", price: 599, description: "Shockproof silicone case, available for most phone models.", tags: ["case", "cover", "mobile"], imgSeed: "zain-case", negotiable: true },
      { name: "Tempered Glass Protector", price: 299, description: "9H hardness tempered glass screen protector.", tags: ["screen protector", "glass", "mobile"], imgSeed: "zain-glass" },
      { name: "Type-C Fast Charging Cable", price: 450, discountPrice: 399, description: "1.5m braided Type-C cable, 3A fast charging.", tags: ["cable", "charger", "type-c"], imgSeed: "zain-cable" },
      { name: "Power Bank 10000mAh", price: 2200, description: "Compact power bank with dual USB output.", tags: ["power bank", "battery", "charging"], imgSeed: "zain-powerbank" },
      { name: "Bluetooth Wireless Earbuds", price: 2800, discountPrice: 2399, description: "Bluetooth 5.3 earbuds with charging case, 24h battery.", tags: ["earbuds", "bluetooth", "audio"], imgSeed: "zain-earbuds" },
      { name: "Portable Bluetooth Speaker", price: 1900, description: "Compact wireless speaker with rich bass.", tags: ["speaker", "bluetooth", "audio"], imgSeed: "zain-speaker" },
      { name: "Car Mobile Charger (Dual USB)", price: 550, description: "Fast-charging dual-port car charger adapter.", tags: ["car charger", "charging", "mobile"], imgSeed: "zain-carcharger" },
      { name: "Mobile Stand / Holder", price: 350, description: "Adjustable desktop mobile phone stand.", tags: ["stand", "holder", "accessory"], imgSeed: "zain-stand", negotiable: true },
      { name: "Selfie Ring Light with Tripod", price: 1300, description: "LED ring light with adjustable tripod stand for video calls & selfies.", tags: ["ring light", "tripod", "accessory"], imgSeed: "zain-ringlight" },
    ],
  },
  {
    name: "Hina's Closet",
    slug: "hinas-closet",
    category: "Clothing",
    city: "Islamabad",
    area: "G-9",
    desc: "Trendy ready-to-wear outfits for women — casual, formal and party wear at affordable prices.",
    whatsapp: "0300-1110003",
    instagram: "hinas.closet",
    headline: "Ready-to-wear fashion for every occasion",
    tagline: "Casual, formal and party wear — curated for the modern Pakistani woman.",
    theme: "rose",
    deliveryInfo: "Delivery across Pakistan within 3-5 days.",
    paymentInfo: "Cash on Delivery / Bank transfer",
    products: [
      { name: "Printed Lawn 3-Piece Suit", price: 3500, discountPrice: 2999, description: "Unstitched printed lawn suit with chiffon dupatta.", tags: ["lawn", "3-piece", "unstitched"], imgSeed: "hina-lawn" },
      { name: "Casual Cotton Kurti", price: 1800, description: "Comfortable everyday cotton kurti, sizes S-XL.", tags: ["kurti", "casual", "cotton"], imgSeed: "hina-kurti", negotiable: true },
      { name: "Embroidered Chiffon Dupatta", price: 1200, description: "Hand-embroidered chiffon dupatta with lace border.", tags: ["dupatta", "embroidered", "chiffon"], imgSeed: "hina-dupatta" },
      { name: "Formal Party Wear Frock", price: 6500, description: "Festive party wear frock with sequin detailing.", tags: ["frock", "party", "formal"], imgSeed: "hina-frock" },
      { name: "Slim Fit Denim Jeans", price: 2800, description: "Stretchable slim-fit denim jeans, sizes 28-36.", tags: ["jeans", "denim", "casual"], imgSeed: "hina-jeans" },
      { name: "Formal Office Shirt", price: 2200, discountPrice: 1899, description: "Wrinkle-free formal shirt for office wear.", tags: ["shirt", "formal", "office"], imgSeed: "hina-shirt" },
      { name: "Embroidered Abaya", price: 4200, description: "Elegant black abaya with front embroidery.", tags: ["abaya", "modest wear", "embroidered"], imgSeed: "hina-abaya" },
      { name: "Printed Chiffon Hijab", price: 650, description: "Soft printed chiffon hijab, multiple colours.", tags: ["hijab", "scarf", "chiffon"], imgSeed: "hina-hijab", negotiable: true },
      { name: "Women's Flat Sandals", price: 1500, description: "Comfortable everyday flat sandals.", tags: ["sandals", "shoes", "footwear"], imgSeed: "hina-sandals" },
    ],
  },
  {
    name: "Bakers Corner",
    slug: "bakers-corner",
    category: "Bakery",
    city: "Faisalabad",
    area: "D Ground",
    desc: "Freshly baked cakes, pastries, bread and cookies — made daily with quality ingredients.",
    whatsapp: "0300-1110004",
    headline: "Freshly baked, every single day",
    tagline: "Cakes, pastries, bread and cookies — baked fresh, delivered warm.",
    theme: "amber",
    deliveryInfo: "Same-day delivery within Faisalabad.",
    paymentInfo: "Cash on Delivery",
    products: [
      { name: "Chocolate Fudge Cake (1kg)", price: 1800, description: "Rich chocolate fudge cake with ganache topping.", tags: ["cake", "chocolate", "birthday"], imgSeed: "baker-cake" },
      { name: "Fresh Bread Loaf", price: 220, description: "Soft, freshly baked white bread loaf.", tags: ["bread", "bakery", "fresh"], imgSeed: "baker-bread" },
      { name: "Cupcake Box (6 pcs)", price: 900, description: "Assorted flavour cupcakes, box of 6.", tags: ["cupcake", "dessert", "box"], imgSeed: "baker-cupcake" },
      { name: "Butter Cookies Jar", price: 650, discountPrice: 549, description: "Crunchy homemade butter cookies, 400g jar.", tags: ["cookies", "snacks", "jar"], imgSeed: "baker-cookies" },
      { name: "Red Velvet Cake (1kg)", price: 2100, description: "Classic red velvet cake with cream cheese frosting.", tags: ["cake", "red velvet", "birthday"], imgSeed: "baker-redvelvet" },
      { name: "New York Cheesecake Slice", price: 450, description: "Creamy baked cheesecake, single slice.", tags: ["cheesecake", "dessert"], imgSeed: "baker-cheesecake" },
      { name: "Assorted Donuts Box (6 pcs)", price: 950, description: "Glazed and filled donuts, box of 6.", tags: ["donuts", "dessert", "box"], imgSeed: "baker-donuts" },
      { name: "Chocolate Brownie Box (4 pcs)", price: 700, discountPrice: 599, description: "Fudgy chocolate brownies, box of 4.", tags: ["brownie", "chocolate", "dessert"], imgSeed: "baker-brownie" },
      { name: "Dinner Bread Rolls (Pack of 8)", price: 320, description: "Soft dinner rolls, freshly baked daily.", tags: ["bread", "rolls", "bakery"], imgSeed: "baker-rolls" },
    ],
  },
  {
    name: "Glow Beauty Store",
    slug: "glow-beauty-store",
    category: "Cosmetics",
    city: "Multan",
    area: "Cantt",
    desc: "Affordable skincare and makeup essentials for your everyday glow-up.",
    whatsapp: "0300-1110005",
    instagram: "glow.beautystore",
    headline: "Everyday glam, made affordable",
    tagline: "Makeup and skincare essentials for your daily routine.",
    theme: "rose",
    deliveryInfo: "Delivery across Multan and nearby cities.",
    paymentInfo: "COD only",
    products: [
      { name: "Matte Liquid Lipstick", price: 550, description: "Long-lasting matte liquid lipstick, multiple shades.", tags: ["lipstick", "matte", "makeup"], imgSeed: "glow-lipstick", negotiable: true },
      { name: "Gentle Face Wash 150ml", price: 750, description: "Sulphate-free gentle face wash for daily use.", tags: ["face wash", "skincare", "cleanser"], imgSeed: "glow-facewash" },
      { name: "Vitamin C Brightening Serum", price: 2100, discountPrice: 1799, description: "Brightening face serum with 10% vitamin C.", tags: ["serum", "skincare", "vitamin-c"], imgSeed: "glow-serum" },
      { name: "Makeup Brush Set (8 pcs)", price: 1450, description: "Soft bristle makeup brush set with pouch.", tags: ["brushes", "makeup", "set"], imgSeed: "glow-brushes" },
      { name: "Waterproof Eyeliner", price: 450, description: "Smudge-proof waterproof liquid eyeliner.", tags: ["eyeliner", "makeup"], imgSeed: "glow-eyeliner" },
      { name: "Compact Powder", price: 850, description: "Lightweight oil-control compact powder.", tags: ["compact", "powder", "makeup"], imgSeed: "glow-compact" },
      { name: "Nail Polish Set (6 colours)", price: 900, discountPrice: 749, description: "Long-lasting nail polish set, 6 trendy shades.", tags: ["nail polish", "makeup", "set"], imgSeed: "glow-nailpolish" },
      { name: "Daily Moisturizer Cream 100ml", price: 980, description: "Lightweight daily moisturizer for all skin types.", tags: ["moisturizer", "skincare", "cream"], imgSeed: "glow-moisturizer" },
      { name: "Hair Growth Serum 60ml", price: 1350, description: "Nourishing hair serum for stronger, shinier hair.", tags: ["hair serum", "haircare"], imgSeed: "glow-hairserum" },
    ],
  },
  {
    name: "Rawal Sports Hub",
    slug: "rawal-sports-hub",
    category: "Sports",
    city: "Rawalpindi",
    area: "Saddar",
    desc: "Sportswear, footwear and fitness gear for athletes and everyday fitness enthusiasts.",
    whatsapp: "0300-1110006",
    headline: "Gear up for your next game",
    tagline: "Sportswear, footwear and fitness gear at unbeatable prices.",
    theme: "dark",
    deliveryInfo: "Delivery across Rawalpindi & Islamabad within 2 days.",
    paymentInfo: "COD / Bank transfer",
    products: [
      { name: "Running Shoes", price: 4500, discountPrice: 3999, description: "Lightweight running shoes with breathable mesh.", tags: ["shoes", "running", "sports"], imgSeed: "rawal-shoes" },
      { name: "Cricket Bat (Hard Ball)", price: 3200, description: "English willow cricket bat for hard-ball cricket.", tags: ["cricket", "bat", "sports"], imgSeed: "rawal-bat" },
      { name: "Football Size 5", price: 1600, description: "Match-quality size 5 football.", tags: ["football", "sports", "outdoor"], imgSeed: "rawal-football" },
      { name: "Yoga Mat (6mm)", price: 1200, description: "Non-slip 6mm thick yoga & exercise mat.", tags: ["yoga", "fitness", "mat"], imgSeed: "rawal-yogamat", negotiable: true },
      { name: "Gym Training Gloves", price: 850, description: "Padded gym gloves with wrist support.", tags: ["gloves", "gym", "fitness"], imgSeed: "rawal-gloves" },
      { name: "Skipping Rope (Adjustable)", price: 550, description: "Adjustable-length skipping rope for cardio workouts.", tags: ["skipping rope", "fitness", "cardio"], imgSeed: "rawal-rope" },
      { name: "Badminton Racket Set (2 pcs)", price: 2400, discountPrice: 1999, description: "Aluminium badminton racket set with 2 shuttlecocks.", tags: ["badminton", "racket", "sports"], imgSeed: "rawal-badminton" },
      { name: "Sports Water Bottle 1L", price: 450, description: "Leak-proof BPA-free sports water bottle, 1 litre.", tags: ["water bottle", "sports", "fitness"], imgSeed: "rawal-bottle" },
      { name: "Men's Track Suit", price: 2800, description: "Comfortable 2-piece track suit for training and casual wear.", tags: ["tracksuit", "sportswear", "fitness"], imgSeed: "rawal-tracksuit" },
    ],
  },
];

async function run() {
  await connectDB();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  let created = 0;
  let updated = 0;
  for (const s of STORES) {
    const email = `${s.slug.replace(/-/g, ".")}@bazaarnagar.test`;
    let seller = await Seller.findOne({ email });
    const isNewSeller = !seller;
    if (!seller) {
      seller = await Seller.create({
        name: s.name,
        phone: s.whatsapp,
        email,
        passwordHash,
        status: "active",
        planId: "starter",
        subscriptionStatus: "active",
        subscriptionStartedAt: now,
        subscriptionEndsAt: oneYear,
      });
    }

    const storeFields = {
      sellerId: seller._id,
      name: s.name,
      logoUrl: logo(s.slug),
      coverUrl: cover(`${s.slug}-cover`),
      description: s.desc,
      category: s.category,
      whatsapp: s.whatsapp,
      city: s.city,
      area: s.area,
      showLocation: false,
      showInSearch: true,
      isOpen: true,
      socials: s.instagram ? { instagram: s.instagram } : undefined,
      deliveryInfo: s.deliveryInfo,
      paymentInfo: s.paymentInfo,
      landing: {
        enabled: true,
        theme: s.theme,
        headline: s.headline,
        tagline: s.tagline,
        heroImageUrl: cover(`${s.slug}-hero`),
        primaryCtaLabel: "Browse products",
        showFeatured: true,
        featuredProductIds: [] as string[],
        showAbout: true,
        aboutTitle: `Why shop with ${s.name}`,
        aboutText: s.desc,
        showContact: true,
      },
      status: "active" as const,
    };

    let store = await Store.findOneAndUpdate(
      { slug: s.slug },
      { $set: storeFields, $setOnInsert: { views: Math.floor(Math.random() * 200) + 20, whatsappClicks: Math.floor(Math.random() * 20) + 1 } },
      { upsert: true, new: true }
    );

    if (isNewSeller) {
      seller.storeId = store._id as typeof seller.storeId;
      await seller.save();
    }

    const existingNames = new Set(
      (await Product.find({ storeId: store._id }).select("name")).map((p) => p.name)
    );
    const missing = s.products.filter((p) => !existingNames.has(p.name));

    if (missing.length > 0) {
      await Product.create(
        missing.map((p) => ({
          storeId: store!._id,
          name: p.name,
          category: s.category,
          price: p.price,
          discountPrice: p.discountPrice,
          images: [img(p.imgSeed), img(`${p.imgSeed}-2`)],
          description: p.description,
          tags: p.tags,
          stockStatus: "in_stock" as const,
          status: "active" as const,
          negotiable: p.negotiable ?? false,
          condition: "new" as const,
          deliveryAvailable: true,
          moderationStatus: "approved" as const,
          views: Math.floor(Math.random() * 80),
          whatsappClicks: Math.floor(Math.random() * 10),
        }))
      );
    }

    const allProducts = await Product.find({ storeId: store._id }).sort({ createdAt: 1 });
    store.landing!.featuredProductIds = allProducts.slice(0, 2).map((p) => p.id);
    await store.save();

    console.log(`${isNewSeller ? "✓ Created" : "↻ Updated"} ${s.name} — /store/${s.slug}  (${allProducts.length} products, +${missing.length} new; login: ${email} / ${PASSWORD})`);
    if (isNewSeller) created++;
    else updated++;
  }

  console.log(`\nDone — ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
