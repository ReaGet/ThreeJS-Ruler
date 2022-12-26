export default function createMachine(stateMachineDefinition) {
  const machine = {
    value: stateMachineDefinition.initialState,
    transition(currentState, event) {
      const currentStateDefinition = stateMachineDefinition[currentState];
      const destinationTransition = currentStateDefinition.transitions[event];
      if (!destinationTransition) {
        return;
      }
      const destinationState = destinationTransition.target;
      const destinationStateDefinition = stateMachineDefinition[destinationState];

      destinationTransition.action();
      currentStateDefinition.actions?.onExit();
      destinationStateDefinition.actions?.onEnter();

      machine.value = destinationState;

      return machine.value;
    },
    action(currentState, event) {
      const currentStateDefinition = stateMachineDefinition[currentState];
      const destinationAction = currentStateDefinition.actions[event];

      if (!destinationAction) {
        return;
      }

      destinationAction(machine);
    },
  };
  return machine;
}