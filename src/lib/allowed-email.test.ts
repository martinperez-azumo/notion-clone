import { describe, expect, it } from "vitest";

import { allowedDomains, isAllowedEmail } from "./allowed-email";

const domains = ["azumo.co", "azumolabs.com"];

describe("isAllowedEmail", () => {
  it.each(["ana@azumo.co", "ana@azumolabs.com", "Ana@AZUMO.CO"])(
    "accepts %s",
    (email) => expect(isAllowedEmail(email, domains)).toBe(true),
  );

  it.each([
    "ana@gmail.com",
    "ana@azumo.com",
    "ana@azumo.co.uk",
    "ana@evilazumo.co",
    "ana@azumo.co.evil.io",
    "ana@mail.azumo.co",
    "azumo.co",
    "@azumo.co",
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
    expect(allowedDomains(" Azumo.co , example.org,")).toEqual([
      "azumo.co",
      "example.org",
    ]);
  });
});
