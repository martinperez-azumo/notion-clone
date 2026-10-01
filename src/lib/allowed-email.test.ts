import { describe, expect, it } from "vitest";

import { allowedDomains, isAllowedEmail } from "./allowed-email";

const domains = ["azumo.com", "azumolabs.com"];

describe("isAllowedEmail", () => {
  it.each(["ana@azumo.com", "ana@azumolabs.com", "Ana@AZUMO.COM"])(
    "accepts %s",
    (email) => expect(isAllowedEmail(email, domains)).toBe(true),
  );

  it.each([
    "ana@gmail.com",
    "ana@evilazumo.com",
    "ana@azumo.com.evil.io",
    "ana@mail.azumo.com",
    "azumo.com",
    "@azumo.com",
    "",
    null,
    undefined,
  ])("rejects %s", (email) => expect(isAllowedEmail(email, domains)).toBe(false));
});

describe("allowedDomains", () => {
  it("defaults to both Azumo domains", () => {
    expect(allowedDomains("")).toEqual(domains);
  });

  it("trims and lowercases a configured list", () => {
    expect(allowedDomains(" Azumo.com , example.org,")).toEqual([
      "azumo.com",
      "example.org",
    ]);
  });
});
