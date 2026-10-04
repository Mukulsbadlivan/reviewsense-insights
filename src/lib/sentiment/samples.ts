import type { Context } from "./types";

export interface Sample { id: string; label: string; subject: string; context: Exclude<Context, "auto">; text: string }

function dated(start: string, stepDays: number, lines: string[], sources: string[]) {
  const t0 = Date.parse(start);
  return lines.map((l, i) => {
    const d = new Date(t0 + i * stepDays * 864e5 + ((i * 37) % 5) * 864e5).toISOString().slice(0, 10);
    return `${i + 1}. [${sources[i % sources.length]}] ${d} — ${l}`;
  }).join("\n");
}

export const SAMPLES: Sample[] = [
  {
    id: "youtube", label: "YouTube comments", subject: "“Build a SaaS in 24h” video", context: "youtube",
    text: dated("2026-06-01", 3, [
      "This video is amazing, the editing is super clean and the explanation is so clear!",
      "Subscribed! Best tutorial I've watched on this topic.",
      "Audio is really bad in the second half, hard to follow.",
      "Too much clickbait in the title, the content was not what I expected.",
      "Thanks for this, really helpful for my project 🙌",
      "Can you do a follow-up on deployment?",
      "Way too many ads, I stopped watching after 5 minutes.",
      "Great pacing and fantastic examples. Love this channel ❤️",
      "Watched at 2x speed, it's okay.",
      "The code on screen is blurry and difficult to read.",
      "Incredibly informative, I finally understand authentication.",
      "Meh, felt rushed and the ending was confusing.",
      "Which editor theme are you using?",
      "Brilliant content as always, the creator really explains things well.",
      "Not helpful at all, skipped important steps.",
      "Best channel for developers, keep it up!",
      "Video quality improved a lot compared to older uploads, nice work.",
      "Uploaded on time like every week.",
      "Annoying background music, please lower it next time.",
      "Absolutely loved the live coding section 🔥",
    ], ["YouTube", "YouTube", "YouTube Shorts"]),
  },
  {
    id: "product", label: "Product reviews", subject: "AeroSound X2 Headphones", context: "product",
    text: dated("2026-01-10", 9, [
      "Sound quality is excellent and the battery lasts forever. 5/5",
      "Delivery was late by a week and the package arrived damaged.",
      "Very comfortable for long flights, noise cancelling is impressive.",
      "Overpriced for what you get. The build feels cheap. 2 stars",
      "Works as described.",
      "Bluetooth keeps disconnecting, really frustrating problem.",
      "Love the design and the case is durable. Highly recommend!",
      "Returned it, the left earcup was defective. Refund took ages.",
      "Good value, solid bass, easy to pair with my phone.",
      "The size is a bit small for my head but the sound is great.",
      "Battery died after three months, terrible quality control.",
      "Bought this as a gift, they were delighted.",
      "Average headphones, nothing special.",
      "Customer support was friendly and quickly fixed my issue.",
      "Microphone is poor on calls, people can barely hear me.",
      "Best purchase this year, premium feel and stunning sound 4.5 stars",
      "Shipping was fast and packaging was clean.",
      "Not worth the price, disappointed.",
      "The app for EQ settings is confusing.",
      "Fantastic noise cancelling, perfect for the office.",
      "Ear pads started peeling, cheap material.",
      "Arrived on Tuesday.",
    ], ["Amazon", "Best Buy", "Website"]),
  },
  {
    id: "movie", label: "Movie reviews", subject: "“Northern Lights” (2026)", context: "movie",
    text: dated("2026-03-01", 4, [
      "A masterpiece. Stunning cinematography and gripping performances from the whole cast.",
      "Boring and predictable plot, I almost fell asleep.",
      "The lead actress is brilliant, she carries the film.",
      "Way too long, the second act drags and the dialogue is dull.",
      "Watched it with friends on opening night.",
      "Beautiful score and an emotional ending, loved it.",
      "The director tried too hard; the screenplay is a mess.",
      "Hilarious in places and surprisingly moving. Great fun.",
      "Visual effects looked fake in the action scenes.",
      "Solid sequel, better than the first movie.",
      "Mediocre at best, the hype was not deserved.",
      "It's a two hour film about a lighthouse keeper.",
      "Outstanding acting and an inspiring story. 5 stars",
      "Disappointing ending ruined an otherwise good movie.",
      "One of my favorite films of the year!",
      "Sound mixing in the cinema was awful.",
    ], ["IMDb", "Rotten Tomatoes", "Letterboxd"]),
  },
  {
    id: "company", label: "Company reviews", subject: "Northwind Technologies", context: "company",
    text: dated("2025-07-01", 14, [
      "Great culture, supportive colleagues and flexible remote work.",
      "Management is toxic and micromanagement is everywhere.",
      "Good benefits and fair salary for the region.",
      "Underpaid and overworked, burnout is common in my team.",
      "Interview process took three rounds over two weeks.",
      "Excellent career growth, my manager really invests in people.",
      "Constant layoffs make the environment very stressful.",
      "Office is clean and comfortable, free lunch is nice.",
      "Leadership communicates poorly and priorities change every month.",
      "Love the mission and the learning opportunities.",
      "Work-life balance is terrible during release season.",
      "Generous parental leave and helpful HR team.",
      "Average company, nothing stands out.",
      "Promotion process is unfair and not transparent.",
      "Smart, friendly employees and great onboarding.",
      "Salary reviews were delayed again this year, disappointing.",
      "Hybrid policy improved a lot recently, happy with the change.",
      "Benefits are okay but health plan is expensive.",
    ], ["Glassdoor", "Indeed", "Internal survey"]),
  },
];
