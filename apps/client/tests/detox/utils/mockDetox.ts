export interface ScreenState {
  readonly name: string;
  readonly accessibilityElements: readonly string[];
  readonly canProceed: boolean;
}

export interface ScenarioState {
  current: ScreenState;
  history: ScreenState[];
  offline: boolean;
}

export interface ScenarioConfig {
  readonly initial: ScreenState;
}

export interface ScenarioController {
  readonly device: {
    launchApp(): Promise<void>;
    setOffline(offline: boolean): Promise<void>;
  };
  readonly element: (id: string) => {
    tap(): Promise<void>;
    expectVisible(): Promise<void>;
  };
  readonly expectScreen: (name: string) => Promise<void>;
  readonly markAccessible: (id: string) => Promise<void>;
}

export function createScenario(config: ScenarioConfig): ScenarioController {
  const state: ScenarioState = {
    current: config.initial,
    history: [config.initial],
    offline: false,
  };

  async function transition(next: ScreenState): Promise<void> {
    state.history.push(next);
    state.current = next;
  }

  return {
    device: {
      async launchApp() {
        await transition(config.initial);
      },
      async setOffline(offline: boolean) {
        state.offline = offline;
      },
    },
    element(id: string) {
      return {
        async tap() {
          if (!state.current.canProceed) {
            throw new Error(`Cannot proceed from screen ${state.current.name}`);
          }
          const next: ScreenState = {
            name: `${state.current.name}->${id}`,
            accessibilityElements: state.current.accessibilityElements,
            canProceed: true,
          };
          await transition(next);
        },
        async expectVisible() {
          if (!state.current.accessibilityElements.includes(id)) {
            throw new Error(`Accessibility element ${id} missing`);
          }
        },
      };
    },
    async expectScreen(name: string) {
      if (state.current.name !== name) {
        throw new Error(`Expected screen ${name} but on ${state.current.name}`);
      }
    },
    async markAccessible(id: string) {
      state.current = {
        ...state.current,
        accessibilityElements: Array.from(new Set([...state.current.accessibilityElements, id])),
      };
    },
  };
}
