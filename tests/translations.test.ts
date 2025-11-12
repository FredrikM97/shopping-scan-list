import { describe, it, expect, beforeEach } from "vitest";
import {
  setLanguage,
  translate,
  translationsStore,
} from "../src/translations/translations";

// Patch translations and currentLang for test
const en = {
  hello: "Hello",
  nested: { key: "Value" },
  vars: "Hi {name}!",
};
const sv = {
  hello: "Hej",
  nested: { key: "Värde" },
  vars: "Hej {name}!",
};

describe("translations", () => {
  beforeEach(() => {
    translationsStore.translations = { en, sv };
    translationsStore.currentLang = "en";
    setLanguage("en");
  });

  it("returns English by default", () => {
    expect(translate("hello")).toBe("Hello");
  });

  it("switches language", () => {
    setLanguage("sv");
    expect(translate("hello")).toBe("Hej");
  });

  it("falls back to English if missing", () => {
    setLanguage("sv");
    expect(translate("notfound")).toBe("notfound");
  });

  it("supports nested keys", () => {
    expect(translate("nested.key")).toBe("Value");
    setLanguage("sv");
    expect(translate("nested.key")).toBe("Värde");
  });

  it("replaces variables", () => {
    expect(translate("vars", { name: "Alice" })).toBe("Hi Alice!");
    setLanguage("sv");
    expect(translate("vars", { name: "Bob" })).toBe("Hej Bob!");
  });
});
