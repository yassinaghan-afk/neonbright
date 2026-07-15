/**
 * Instagram multi-post + seamless marquee tests.
 * Run: npx tsx --test tests/instagram-marquee.test.ts
 * Does not touch production CMS.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  expandCarouselIntoPosts,
  filterPublicPosts,
  normalizeInstagramPosts,
} from "../lib/cms/instagram-normalize";
import {
  buildMarqueeTrack,
  computeMarqueeCopies,
} from "../lib/instagram/marquee";
import type { CMSInstagramPost } from "../lib/cms/types";

function makePost(
  index: number,
  overrides: Partial<CMSInstagramPost> = {}
): CMSInstagramPost {
  return {
    id: `igp_${index}`,
    image: `/uploads/instagram/post-${index}.jpg`,
    caption: `Post ${index}`,
    instagramUrl: `https://www.instagram.com/p/post-${index}/`,
    enabled: true,
    sortOrder: index,
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

test("stores 10 independent posts when 10 images are provided", () => {
  const posts = normalizeInstagramPosts(
    Array.from({ length: 10 }, (_, i) => ({
      image: `/uploads/instagram/${i}.jpg`,
      caption: `Post ${i + 1}`,
      instagramUrl: `https://www.instagram.com/p/${i}/`,
    }))
  );

  assert.equal(posts.length, 10);
  assert.equal(new Set(posts.map((p) => p.id)).size, 10);
  assert.equal(new Set(posts.map((p) => p.image)).size, 10);
  posts.forEach((p, i) => {
    assert.equal(p.sortOrder, i);
    assert.equal(p.enabled, true);
    assert.equal(p.carouselImages, undefined);
  });
});

test("appends an 11th post without replacing the first 10", () => {
  const firstTen = normalizeInstagramPosts(
    Array.from({ length: 10 }, (_, i) => ({
      id: `igp_${i}`,
      image: `/uploads/instagram/${i}.jpg`,
      caption: `Post ${i + 1}`,
      instagramUrl: `https://www.instagram.com/p/${i}/`,
    }))
  );
  const appended = normalizeInstagramPosts([
    ...firstTen,
    {
      id: "igp_10",
      image: "/uploads/instagram/10.jpg",
      caption: "Post 11",
      instagramUrl: "https://www.instagram.com/p/10/",
    },
  ]);

  assert.equal(appended.length, 11);
  assert.deepEqual(
    appended.slice(0, 10).map((p) => p.id),
    firstTen.map((p) => p.id)
  );
  assert.equal(appended[10].image, "/uploads/instagram/10.jpg");
});

test("expands legacy carouselImages into separate posts (root cause of single image)", () => {
  const collapsed = normalizeInstagramPosts([
    {
      id: "igp_legacy",
      image: "/uploads/instagram/a.jpg",
      carouselImages: ["/uploads/instagram/b.jpg", "/uploads/instagram/c.jpg"],
      caption: "Legacy",
      instagramUrl: "https://www.instagram.com/p/legacy/",
    },
  ]);

  assert.equal(collapsed.length, 3);
  assert.deepEqual(
    collapsed.map((p) => p.image),
    [
      "/uploads/instagram/a.jpg",
      "/uploads/instagram/b.jpg",
      "/uploads/instagram/c.jpg",
    ]
  );
  assert.ok(collapsed.every((p) => !p.carouselImages?.length));
});

test("hiding one of 10 posts removes only that post from public list", () => {
  const posts = Array.from({ length: 10 }, (_, i) => makePost(i));
  posts[6].enabled = false;
  const publicPosts = filterPublicPosts(posts);
  assert.equal(publicPosts.length, 9);
  assert.equal(
    publicPosts.find((p) => p.id === "igp_6"),
    undefined
  );
  assert.ok(publicPosts.map((p) => p.id).includes("igp_0"));
  assert.ok(publicPosts.map((p) => p.id).includes("igp_9"));
});

test("each of 10 posts keeps its own instagramUrl for popup buttons", () => {
  const posts = Array.from({ length: 10 }, (_, i) => makePost(i));
  assert.equal(posts[6].instagramUrl, "https://www.instagram.com/p/post-6/");
  assert.notEqual(posts[0].instagramUrl, posts[6].instagramUrl);
});

test("marquee duplicates 10 posts with seamless handoff post10→post1", () => {
  const posts = Array.from({ length: 10 }, (_, i) => makePost(i));
  const setWidth = 10 * 300;
  const viewport = 1440;
  const copies = computeMarqueeCopies(posts.length, viewport, setWidth);
  assert.ok(copies >= 2);

  const track = buildMarqueeTrack(posts, copies);
  assert.equal(track.length, 10 * copies);
  assert.equal(track[9].id, "igp_9");
  assert.equal(track[10].id, "igp_0");
});

test("marquee duplicates 3 posts enough times to fill viewport", () => {
  const posts = [makePost(0), makePost(1), makePost(2)];
  const setWidth = 3 * 280;
  const viewport = 1600;
  const copies = computeMarqueeCopies(3, viewport, setWidth);
  assert.ok(copies >= Math.ceil((1600 * 2) / setWidth));
  const track = buildMarqueeTrack(posts, copies);
  assert.equal(track.length, 3 * copies);
  assert.ok(track.length * 280 >= viewport * 2);
});

test("marquee duplicates 1 post enough times so no empty area", () => {
  const copies = computeMarqueeCopies(1, 1200, 200);
  assert.ok(copies >= 12);
  const track = buildMarqueeTrack([makePost(0)], copies);
  assert.ok(track.every((p) => p.id === "igp_0"));
  assert.equal(track.length, copies);
});

test("track duplication does not mutate the CMS post array", () => {
  const original = Array.from({ length: 10 }, (_, i) => makePost(i));
  const snapshot = JSON.stringify(original);
  buildMarqueeTrack(original, computeMarqueeCopies(10, 1400, 3000));
  assert.equal(JSON.stringify(original), snapshot);
});

test("expandCarouselIntoPosts keeps already-flat 10 posts unchanged in count", () => {
  const flat = Array.from({ length: 10 }, (_, i) => makePost(i));
  assert.equal(expandCarouselIntoPosts(flat).length, 10);
});
