import { beforeEach, describe, expect, test } from "vitest";
import {
  getDifficultyTier,
  recordSkillEvent,
  getProgress,
  getLevel,
  completeMission,
  getCompletedMissions,
  getProfiles,
  addProfile,
} from "./storage.js";

beforeEach(() => {
  localStorage.clear();
});

describe("getDifficultyTier", () => {
  test.each([
    [5, 1],
    [6, 1],
    [7, 2],
    [8, 2],
    [9, 3],
  ])("age %i -> tier %i", (age, tier) => {
    expect(getDifficultyTier(age)).toBe(tier);
  });
});

describe("recordSkillEvent / getProgress / getLevel round-trip", () => {
  test("records correct answers, awards XP, and levels up", () => {
    const name = "Explorer";
    for (let i = 0; i < 12; i++) {
      recordSkillEvent(name, "alphabet-letter", true);
    }
    const progress = getProgress(name);
    expect(progress.xp).toBe(120);
    expect(progress.skills["alphabet-letter"].attempts).toBe(12);
    expect(progress.skills["alphabet-letter"].correct).toBe(12);
    expect(getLevel(progress.xp)).toBe(2);
  });

  test("incorrect answers do not award XP and reset streak", () => {
    const name = "Explorer";
    recordSkillEvent(name, "reading-word", true);
    recordSkillEvent(name, "reading-word", false);
    const progress = getProgress(name);
    expect(progress.xp).toBe(10);
    expect(progress.skills["reading-word"].streak).toBe(0);
  });

  test("unknown profile has empty default progress", () => {
    const progress = getProgress("Nobody");
    expect(progress.xp).toBe(0);
    expect(progress.skills).toEqual({});
  });
});

describe("completeMission / getCompletedMissions round-trip", () => {
  test("marks a mission done and persists it for the profile", () => {
    expect(getCompletedMissions("Explorer")).toEqual([]);
    completeMission("Explorer", "mission-1");
    completeMission("Explorer", "mission-2");
    expect(getCompletedMissions("Explorer").sort()).toEqual(["mission-1", "mission-2"]);
  });

  test("is scoped per profile", () => {
    completeMission("Alice", "mission-1");
    expect(getCompletedMissions("Alice")).toEqual(["mission-1"]);
    expect(getCompletedMissions("Bob")).toEqual([]);
  });
});

describe("getProfiles / addProfile", () => {
  test("addProfile adds a new profile, retrievable via getProfiles", () => {
    expect(getProfiles()).toEqual([]);
    addProfile({ name: "Alice", avatar: "🦸", age: 7 });
    const profiles = getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("Alice");
  });

  test("addProfile replaces an existing profile with the same name", () => {
    addProfile({ name: "Alice", avatar: "🦸", age: 7 });
    addProfile({ name: "Alice", avatar: "🧙", age: 8 });
    const profiles = getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].avatar).toBe("🧙");
    expect(profiles[0].age).toBe(8);
  });

  test("migrates an old single-profile key into the profiles array", () => {
    localStorage.setItem(
      "abcmundo.profile",
      JSON.stringify({ name: "Legacy", avatar: "🐼", age: 6 })
    );
    const profiles = getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("Legacy");
    expect(localStorage.getItem("abcmundo.activeProfileName")).toBe("Legacy");
  });
});
