import {
  normalizeIndiaPhone,
  maskEmail,
  verifyPhotoMagicBytes,
} from "@/validations/publicRegistration.validation";

export async function runPublicRegistrationTests(): Promise<{
  passed: number;
  failed: number;
  results: { name: string; success: boolean; error?: string }[];
}> {
  const results: { name: string; success: boolean; error?: string }[] = [];

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      results.push({ name, success: true });
    } catch (err) {
      results.push({
        name,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Phone validation tests
  await test("normalizeIndiaPhone handles valid 10-digit number", () => {
    const res = normalizeIndiaPhone("9876543210");
    assert(res.valid === true, "Should be valid");
    assert(res.tenDigit === "9876543210", "10-digit match");
    assert(res.e164 === "+919876543210", "E.164 match");
  });

  await test("normalizeIndiaPhone cleans formatting and spaces", () => {
    const res = normalizeIndiaPhone("+91 (98765) 432-10");
    assert(res.valid === true, "Should be valid");
    assert(res.tenDigit === "9876543210", "Should be cleaned 10 digits");
  });

  await test("normalizeIndiaPhone rejects invalid prefixes (0-5)", () => {
    const res = normalizeIndiaPhone("5551234567");
    assert(res.valid === false, "5xx is invalid for Indian mobile");
    assert(
      res.error?.includes("10-digit Indian mobile number") === true,
      "Should have standard Indian phone error message",
    );
  });

  await test("normalizeIndiaPhone rejects short input", () => {
    const res = normalizeIndiaPhone("98765");
    assert(res.valid === false, "Too short");
    assert(
      res.error?.includes("10-digit Indian mobile number") === true,
      "Should require 10 digits",
    );
  });

  // 2. Email Masking tests
  await test("maskEmail masks standard email address", () => {
    const masked = maskEmail("alex.morgan@jeffsgroup.org");
    assert(masked === "a****n@jeffsgroup.org", `Got ${masked}`);
  });

  await test("maskEmail handles short email user part", () => {
    const masked = maskEmail("ab@example.com");
    assert(masked === "a*@example.com", `Got ${masked}`);
  });

  // 3. Photo Magic Bytes tests (using Blob mock)
  await test("verifyPhotoMagicBytes identifies valid JPEG SOI marker", async () => {
    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])]);
    const res = await verifyPhotoMagicBytes(blob as unknown as File);
    assert(res.valid === true, "JPEG SOI check");
    assert(res.detectedType === "image/jpeg", "JPEG type detected");
  });

  await test("verifyPhotoMagicBytes identifies valid PNG signature", async () => {
    const blob = new Blob([
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ]);
    const res = await verifyPhotoMagicBytes(blob as unknown as File);
    assert(res.valid === true, "PNG header check");
    assert(res.detectedType === "image/png", "PNG type detected");
  });

  await test("verifyPhotoMagicBytes rejects invalid binary file header", async () => {
    const blob = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])]); // %PDF
    const res = await verifyPhotoMagicBytes(blob as unknown as File);
    assert(res.valid === false, "PDF rejection");
  });

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return { passed, failed, results };
}
