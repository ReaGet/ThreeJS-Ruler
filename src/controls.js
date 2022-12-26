import ui from "./ui.js";
import createMachine from "./stateMachine.js";

const machine = createMachine({
  initialState: "default",
  default: {
    actions: {
      onEnter() {
        ui.setContent("visible", true);
      },
      onExit() {},
      toggleUI() {
        ui.setRuler("active");
        ui.setContent("active");
      },
      toggleRuler() {
        ui.setMain("active");
        ui.setBody("creating");
      }
    },
    transitions() {}
  },

});

ui.on("toggleUI", () => {
  machine.action(machine.value, "toggleUI");
});

ui.on("toggleRuler", () => {
  machine.action(machine.value, "toggleRuler");
});