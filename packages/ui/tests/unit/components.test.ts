import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Note: These are basic structural tests. Full component tests would require
// a React testing environment with jsdom.

describe("Component exports", () => {
  it("exports PageHeader component", async () => {
    const module = await import("../../src/components/page-header.js");
    assert.ok(module.PageHeader, "PageHeader should be exported");
    assert.equal(typeof module.PageHeader, "function", "PageHeader should be a function");
  });

  it("exports Modal component", async () => {
    const module = await import("../../src/components/modal.js");
    assert.ok(module.Modal, "Modal should be exported");
    assert.equal(typeof module.Modal, "function", "Modal should be a function");
  });

  it("exports Drawer component", async () => {
    const module = await import("../../src/components/drawer.js");
    assert.ok(module.Drawer, "Drawer should be exported");
    assert.equal(typeof module.Drawer, "function", "Drawer should be a function");
  });

  it("exports ErrorState component", async () => {
    const module = await import("../../src/components/error-state.js");
    assert.ok(module.ErrorState, "ErrorState should be exported");
    assert.equal(typeof module.ErrorState, "function", "ErrorState should be a function");
  });

  it("exports FormLayout component", async () => {
    const module = await import("../../src/components/form-layout.js");
    assert.ok(module.FormLayout, "FormLayout should be exported");
    assert.equal(typeof module.FormLayout, "function", "FormLayout should be a function");
    assert.ok(module.FormField, "FormField should be exported");
    assert.equal(typeof module.FormField, "function", "FormField should be a function");
  });

  it("exports ValidationBanner component", async () => {
    const module = await import("../../src/components/validation-banner.js");
    assert.ok(module.ValidationBanner, "ValidationBanner should be exported");
    assert.equal(
      typeof module.ValidationBanner,
      "function",
      "ValidationBanner should be a function"
    );
  });

  it("exports StepperForm components", async () => {
    const module = await import("../../src/components/stepper-form.js");
    assert.ok(module.StepperForm, "StepperForm should be exported");
    assert.equal(typeof module.StepperForm, "function", "StepperForm should be a function");
    assert.ok(module.StepperFormActions, "StepperFormActions should be exported");
    assert.equal(
      typeof module.StepperFormActions,
      "function",
      "StepperFormActions should be a function"
    );
  });

  it("exports ReviewStep component", async () => {
    const module = await import("../../src/components/review-step.js");
    assert.ok(module.ReviewStep, "ReviewStep should be exported");
    assert.equal(typeof module.ReviewStep, "function", "ReviewStep should be a function");
  });

  it("all components are exported from index", async () => {
    const module = await import("../../src/index.js");

    // Check new components
    assert.ok(module.PageHeader, "PageHeader should be exported from index");
    assert.ok(module.Modal, "Modal should be exported from index");
    assert.ok(module.Drawer, "Drawer should be exported from index");
    assert.ok(module.ErrorState, "ErrorState should be exported from index");
    assert.ok(module.FormLayout, "FormLayout should be exported from index");
    assert.ok(module.FormField, "FormField should be exported from index");
    assert.ok(module.ValidationBanner, "ValidationBanner should be exported from index");
    assert.ok(module.StepperForm, "StepperForm should be exported from index");
    assert.ok(module.StepperFormActions, "StepperFormActions should be exported from index");
    assert.ok(module.ReviewStep, "ReviewStep should be exported from index");
  });
});
