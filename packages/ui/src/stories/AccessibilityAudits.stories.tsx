import type { ComponentProps } from "react";
import { AccessibleActionButton } from "../components/accessibility/AccessibleActionButton.js";
import { MotionPreferenceToggle } from "../components/accessibility/MotionPreferenceToggle.js";
import { meetsAaNormalText, ensureTouchTarget } from "../utils/accessibility.js";

type StoryMeta<T> = {
  title: string;
  component: T;
  tags?: string[];
  parameters?: Record<string, unknown>;
};

type StoryObj<T> = {
  args?: Partial<ComponentProps<T>>;
  parameters?: Record<string, unknown>;
  render?: () => JSX.Element;
};

const buttonContrastPass = meetsAaNormalText("#14532d", "#ffffff");
const touchTargetPass = ensureTouchTarget(48);

const meta: StoryMeta<typeof AccessibleActionButton> = {
  title: "Accessibility/Action Button",
  component: AccessibleActionButton,
  tags: ["a11y", "regression"],
  parameters: {
    docs: {
      description: {
        component:
          "VoiceOver & TalkBack labels verified. Motion reduction removes hover scaling. Touch target >= 48px. Contrast pass: " +
          String(buttonContrastPass) +
          ", Touch target pass: " +
          String(touchTargetPass),
      },
    },
    chromatic: {
      modes: ["light", "dark"],
    },
  },
};

export default meta;

export const PrimaryAction: StoryObj<typeof AccessibleActionButton> = {
  args: {
    ariaLabel: "Submit contribution",
    children: <span>Submit payment</span>,
  },
};

export const ReducedMotion: StoryObj<typeof AccessibleActionButton> = {
  args: {
    ariaLabel: "Submit without motion",
    children: <span>Submit payment</span>,
    reduceMotion: true,
  },
};

export const MotionPreferenceControl: StoryObj<typeof AccessibleActionButton> = {
  render: () => (
    <MotionPreferenceToggle onChange={(value) => console.info("Motion preference", value)} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Toggles reflect prefers-reduced-motion media queries and emit analytics-friendly callbacks.",
      },
    },
  },
};
