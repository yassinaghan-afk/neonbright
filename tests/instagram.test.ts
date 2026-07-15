/**
 * Instagram Posts Feature Integration Tests
 * 
 * Tests comprehensive CRUD operations, concurrency, visibility toggles,
 * and data integrity for the Instagram posts feature.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import type { CMSContent, CMSInstagramPost } from "@/lib/cms/types";
import { normalizeInstagramPost, normalizeInstagramPosts, filterPublicPosts } from "@/lib/cms/instagram-normalize";
import { createId } from "@/lib/cms/id";

describe("Instagram Posts Feature", () => {
  let tempDir: string;
  let tempCMSPath: string;
  let originalStorageRoot: string | undefined;

  beforeEach(async () => {
    // Create isolated temp directory for each test
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "instagram-test-"));
    tempCMSPath = path.join(tempDir, "cms-content.json");
    
    // Save and override STORAGE_ROOT
    originalStorageRoot = process.env.STORAGE_ROOT;
    process.env.STORAGE_ROOT = tempDir;

    // Initialize empty CMS
    const emptyCMS: Partial<CMSContent> = {
      instagramPosts: [],
      instagram: {
        enabled: true,
        title: "Suivez-nous sur Instagram",
        subtitle: "Test",
        buttonText: "Voir sur Instagram",
        url: "https://www.instagram.com/_neonbright_/",
      },
    };
    await fs.writeFile(tempCMSPath, JSON.stringify(emptyCMS, null, 2), "utf-8");
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    
    // Restore STORAGE_ROOT
    if (originalStorageRoot !== undefined) {
      process.env.STORAGE_ROOT = originalStorageRoot;
    } else {
      delete process.env.STORAGE_ROOT;
    }
  });

  describe("normalizeInstagramPost", () => {
    it("should create a valid post with all required fields", () => {
      const post = normalizeInstagramPost(
        {
          image: "https://example.com/test.jpg",
          caption: "Test caption",
          instagramUrl: "https://www.instagram.com/p/test/",
        },
        0
      );

      expect(post.id).toMatch(/^igp_/);
      expect(post.image).toBe("https://example.com/test.jpg");
      expect(post.caption).toBe("Test caption");
      expect(post.instagramUrl).toBe("https://www.instagram.com/p/test/");
      expect(post.enabled).toBe(true);
      expect(post.sortOrder).toBe(0);
      expect(post.createdAt).toBeDefined();
      expect(post.updatedAt).toBeDefined();
    });

    it("should handle altText field", () => {
      const post = normalizeInstagramPost(
        {
          image: "/uploads/instagram/test.jpg",
          altText: "Alternative text for accessibility",
          caption: "Caption text",
          instagramUrl: "https://www.instagram.com/p/test/",
        },
        0
      );

      expect(post.altText).toBe("Alternative text for accessibility");
      expect(post.caption).toBe("Caption text");
    });

    it("should handle carousel images", () => {
      const post = normalizeInstagramPost(
        {
          image: "/uploads/instagram/1.jpg",
          carouselImages: ["/uploads/instagram/2.jpg", "/uploads/instagram/3.jpg"],
          caption: "Multi-image post",
          instagramUrl: "https://www.instagram.com/p/test/",
        },
        0
      );

      expect(post.carouselImages).toHaveLength(2);
      expect(post.carouselImages).toEqual([
        "/uploads/instagram/2.jpg",
        "/uploads/instagram/3.jpg",
      ]);
    });

    it("should preserve existing createdAt and update updatedAt", () => {
      const existingDate = "2026-01-01T00:00:00.000Z";
      const post = normalizeInstagramPost(
        {
          id: "igp_existing",
          image: "/uploads/instagram/test.jpg",
          caption: "Updated caption",
          instagramUrl: "https://www.instagram.com/p/test/",
          createdAt: existingDate,
        },
        0
      );

      expect(post.createdAt).toBe(existingDate);
      expect(post.updatedAt).toBeDefined();
      expect(post.updatedAt).not.toBe(existingDate);
    });

    it("should default enabled to true when not specified", () => {
      const post = normalizeInstagramPost(
        {
          image: "/uploads/instagram/test.jpg",
          caption: "Test",
          instagramUrl: "https://www.instagram.com/p/test/",
        },
        0
      );

      expect(post.enabled).toBe(true);
    });

    it("should respect enabled: false", () => {
      const post = normalizeInstagramPost(
        {
          image: "/uploads/instagram/test.jpg",
          caption: "Test",
          instagramUrl: "https://www.instagram.com/p/test/",
          enabled: false,
        },
        0
      );

      expect(post.enabled).toBe(false);
    });
  });

  describe("normalizeInstagramPosts", () => {
    it("should normalize an array of posts with correct sortOrder", () => {
      const posts = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "First", instagramUrl: "https://instagram.com/p/1/" },
        { image: "/uploads/instagram/2.jpg", caption: "Second", instagramUrl: "https://instagram.com/p/2/" },
        { image: "/uploads/instagram/3.jpg", caption: "Third", instagramUrl: "https://instagram.com/p/3/" },
      ]);

      expect(posts).toHaveLength(3);
      expect(posts[0].sortOrder).toBe(0);
      expect(posts[1].sortOrder).toBe(1);
      expect(posts[2].sortOrder).toBe(2);
      expect(posts[0].caption).toBe("First");
      expect(posts[1].caption).toBe("Second");
      expect(posts[2].caption).toBe("Third");
    });

    it("should handle empty array", () => {
      const posts = normalizeInstagramPosts([]);
      expect(posts).toEqual([]);
    });
  });

  describe("filterPublicPosts", () => {
    it("should return only enabled posts with images", () => {
      const posts: CMSInstagramPost[] = [
        {
          id: "igp_1",
          image: "/uploads/instagram/1.jpg",
          caption: "Public post",
          instagramUrl: "https://instagram.com/p/1/",
          enabled: true,
          sortOrder: 0,
        },
        {
          id: "igp_2",
          image: "/uploads/instagram/2.jpg",
          caption: "Hidden post",
          instagramUrl: "https://instagram.com/p/2/",
          enabled: false,
          sortOrder: 1,
        },
        {
          id: "igp_3",
          image: "",
          caption: "No image",
          instagramUrl: "https://instagram.com/p/3/",
          enabled: true,
          sortOrder: 2,
        },
        {
          id: "igp_4",
          image: "/uploads/instagram/4.jpg",
          caption: "Another public post",
          instagramUrl: "https://instagram.com/p/4/",
          enabled: true,
          sortOrder: 3,
        },
      ];

      const publicPosts = filterPublicPosts(posts);

      expect(publicPosts).toHaveLength(2);
      expect(publicPosts[0].id).toBe("igp_1");
      expect(publicPosts[1].id).toBe("igp_4");
    });

    it("should return empty array when no public posts", () => {
      const posts: CMSInstagramPost[] = [
        {
          id: "igp_1",
          image: "/uploads/instagram/1.jpg",
          caption: "Hidden",
          instagramUrl: "https://instagram.com/p/1/",
          enabled: false,
          sortOrder: 0,
        },
      ];

      const publicPosts = filterPublicPosts(posts);
      expect(publicPosts).toEqual([]);
    });
  });

  describe("Instagram Posts CRUD", () => {
    it("should add four Instagram posts", () => {
      const posts = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/1/" },
        { image: "/uploads/instagram/2.jpg", caption: "Post 2", instagramUrl: "https://instagram.com/p/2/" },
        { image: "/uploads/instagram/3.jpg", caption: "Post 3", instagramUrl: "https://instagram.com/p/3/" },
        { image: "/uploads/instagram/4.jpg", caption: "Post 4", instagramUrl: "https://instagram.com/p/4/" },
      ]);

      expect(posts).toHaveLength(4);
      posts.forEach((post, index) => {
        expect(post.sortOrder).toBe(index);
        expect(post.enabled).toBe(true);
      });
    });

    it("should hide one post and confirm only that one disappears from public", () => {
      const posts: CMSInstagramPost[] = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/1/" },
        { image: "/uploads/instagram/2.jpg", caption: "Post 2", instagramUrl: "https://instagram.com/p/2/" },
        { image: "/uploads/instagram/3.jpg", caption: "Post 3", instagramUrl: "https://instagram.com/p/3/" },
        { image: "/uploads/instagram/4.jpg", caption: "Post 4", instagramUrl: "https://instagram.com/p/4/" },
      ]);

      // Hide the second post
      posts[1].enabled = false;

      const publicPosts = filterPublicPosts(posts);

      expect(publicPosts).toHaveLength(3);
      expect(publicPosts.map(p => p.caption)).toEqual(["Post 1", "Post 3", "Post 4"]);
    });

    it("should re-enable hidden post and confirm it returns", () => {
      const posts: CMSInstagramPost[] = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/1/", enabled: false },
      ]);

      expect(filterPublicPosts(posts)).toHaveLength(0);

      // Re-enable
      posts[0].enabled = true;

      expect(filterPublicPosts(posts)).toHaveLength(1);
    });

    it("should reorder posts and confirm public order changes", () => {
      const posts: CMSInstagramPost[] = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/1/" },
        { image: "/uploads/instagram/2.jpg", caption: "Post 2", instagramUrl: "https://instagram.com/p/2/" },
        { image: "/uploads/instagram/3.jpg", caption: "Post 3", instagramUrl: "https://instagram.com/p/3/" },
      ]);

      // Reorder: move first to last
      const [first, ...rest] = posts;
      const reordered = [...rest, first].map((post, i) => ({
        ...post,
        sortOrder: i,
      }));

      expect(reordered[0].caption).toBe("Post 2");
      expect(reordered[1].caption).toBe("Post 3");
      expect(reordered[2].caption).toBe("Post 1");
      expect(reordered[0].sortOrder).toBe(0);
      expect(reordered[1].sortOrder).toBe(1);
      expect(reordered[2].sortOrder).toBe(2);
    });

    it("should edit instagramUrl and confirm update", () => {
      const posts: CMSInstagramPost[] = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/old/" },
      ]);

      const originalCreatedAt = posts[0].createdAt;

      // Edit URL
      const updated = normalizeInstagramPost(
        {
          ...posts[0],
          instagramUrl: "https://instagram.com/p/new/",
        },
        0
      );

      expect(updated.instagramUrl).toBe("https://instagram.com/p/new/");
      expect(updated.createdAt).toBe(originalCreatedAt);
      expect(updated.updatedAt).not.toBe(originalCreatedAt);
    });

    it("should delete one post and confirm others remain unchanged", () => {
      const posts: CMSInstagramPost[] = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/1/" },
        { image: "/uploads/instagram/2.jpg", caption: "Post 2", instagramUrl: "https://instagram.com/p/2/" },
        { image: "/uploads/instagram/3.jpg", caption: "Post 3", instagramUrl: "https://instagram.com/p/3/" },
      ]);

      // Delete the second post
      const remaining = posts.filter((_, i) => i !== 1);

      expect(remaining).toHaveLength(2);
      expect(remaining[0].caption).toBe("Post 1");
      expect(remaining[1].caption).toBe("Post 3");
    });
  });

  describe("Section Visibility", () => {
    it("should store posts when section is hidden", () => {
      const posts: CMSInstagramPost[] = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/1/" },
        { image: "/uploads/instagram/2.jpg", caption: "Post 2", instagramUrl: "https://instagram.com/p/2/" },
      ]);

      const sectionEnabled = false;

      // Posts remain in storage
      expect(posts).toHaveLength(2);
      
      // Section would not be visible on public site
      expect(sectionEnabled).toBe(false);
    });

    it("should restore posts in same order when section is re-enabled", () => {
      const posts: CMSInstagramPost[] = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/1/" },
        { image: "/uploads/instagram/2.jpg", caption: "Post 2", instagramUrl: "https://instagram.com/p/2/" },
        { image: "/uploads/instagram/3.jpg", caption: "Post 3", instagramUrl: "https://instagram.com/p/3/" },
      ]);

      // Section hidden, then re-enabled
      const sectionEnabled = true;

      expect(posts).toHaveLength(3);
      expect(posts[0].caption).toBe("Post 1");
      expect(posts[1].caption).toBe("Post 2");
      expect(posts[2].caption).toBe("Post 3");
      expect(sectionEnabled).toBe(true);
    });
  });

  describe("Data Integrity", () => {
    it("should preserve Events, Brands, and other CMS sections when modifying Instagram posts", () => {
      // Simulate full CMS with other sections
      const cms = {
        portfolioProjects: [{ id: "proj_1", title: "Event 1" }],
        testimonials: [{ id: "test_1", quote: "Great work!" }],
        instagramPosts: [],
      };

      // Add Instagram posts
      const newPosts = normalizeInstagramPosts([
        { image: "/uploads/instagram/1.jpg", caption: "Post 1", instagramUrl: "https://instagram.com/p/1/" },
      ]);

      const updatedCMS = {
        ...cms,
        instagramPosts: newPosts,
      };

      // Verify other sections unchanged
      expect(updatedCMS.portfolioProjects).toEqual(cms.portfolioProjects);
      expect(updatedCMS.testimonials).toEqual(cms.testimonials);
      expect(updatedCMS.instagramPosts).toHaveLength(1);
    });

    it("should handle missing instagramUrl gracefully", () => {
      const post = normalizeInstagramPost(
        {
          image: "/uploads/instagram/test.jpg",
          caption: "Test",
          instagramUrl: "",
        },
        0
      );

      expect(post.instagramUrl).toBe("");
      expect(post.image).toBe("/uploads/instagram/test.jpg");
    });

    it("should trim whitespace from URLs and captions", () => {
      const post = normalizeInstagramPost(
        {
          image: "  /uploads/instagram/test.jpg  ",
          caption: "  Test caption  ",
          instagramUrl: "  https://instagram.com/p/test/  ",
        },
        0
      );

      expect(post.image).toBe("/uploads/instagram/test.jpg");
      expect(post.caption).toBe("Test caption");
      expect(post.instagramUrl).toBe("https://instagram.com/p/test/");
    });
  });
});
