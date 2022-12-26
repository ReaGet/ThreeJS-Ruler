import ui from "./ui.js";
import createMachine from "./stateMachine.js";

const controls = createMachine({
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
      enableRuler(machine) {
        ui.setMain("active", true);
        ui.setBody("creating", true);
        ui.setRuler("hidden", true);
        ui.emit("rulerEnabled");
      },
      cancelRuler() {    
        ui.setMain("active", false);
        ui.setRuler("hidden", false);
        ui.setBody("creating", false);
        ui.emit("rulerCanceled");
      },
    },
    transitions: {
      creating: {
        target: "creating",
        action() {
          console.log("transition action for 'creating' in 'off' state");
        },
      },
      startEditing: {
        target: "editing",
        action() {

        }
      }
    }
  },
  creating: {
    actions: {
      onEnter() {
        ui.setRemove("active", true);
        ui.setRemove("disabled", false);
        ui.emit("creating");
      },
      onExit() {
        // mainBtn.classList.add("add");
        // mainBtn.classList.remove("accept");
        // removeBtn.classList.remove("active");
      },
      removeLine(machine) {
        ui.setMain("active", false);
        ui.setRuler("hidden", false);
        ui.setBody("creating", false);
        machine.transition(machine.value, "creating");
        ui.emit("removeLine");
      },
      cancelRuler(machine) {
        ui.setMain("active", false);
        ui.setRuler("hidden", false);
        ui.setBody("creating", false);
        ui.emit("rulerCanceled");
        machine.transition(machine.value, "creating");
      },
    },
    transitions: {
      creating: {
        target: "default",
        action() {
          console.log("transition action for 'stopCreating' in 'on' state");
        },
      },
    },
  },
  editing: {
    actions: {
      onEnter() {
        ui.setRemove("active", true);
        ui.setRemove("disabled", false);
        ui.setMain("disabled", true);
      },
      onExit() {

      },
      enableRuler(machine) {
        machine.transition(machine.value, "default");
      },
      removeLine(machine) {
        ui.emit("removeLine");
        ui.setMain("active", false);
        ui.setRuler("hidden", false);
        ui.setBody("creating", false);
        // machine.transition(machine.value, "startOff");
      },
    },
    transitions: {
      default: {
        target: "default",
        action(machine) {
          console.log("transition action for 'startOff' in 'on' state");
          ui.setMain("disabled", false);
          ui.setRemove("active", false);
          ui.setRemove("disabled", true);
        }
      },
      creating: {
        target: "creating",
        action() {
          console.log("transition action for 'creating' in 'on' state");
        }
      }
    }
  }
});

ui.on("click", (action) => {
  controls.action(controls.value, action);
});

export default controls;