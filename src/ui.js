import createMachine from "./stateMachine.js";
import emitter from "./emitter.js";

const uiContentEl = document.querySelector(".ui-content");
const rulerEl = document.querySelector(".ui-btn.ruler");
const mainBtn = document.querySelector(".ui-btn.ui-btn--main");
const removeBtn = document.querySelector(".ui-btn.remove");

const machine = createMachine({
  initialState: "off",
  off: {
    actions: {
      onEnter() {
        console.log("off: onEnter off");
        rulerEl.classList.remove("hidden");
      },
      onExit() {
        console.log("off: onExit");
      },
      toggleUI() {
        rulerEl.classList.toggle("active");
        uiContentEl.classList.toggle("active");
      },
      enableRuler(machine) {
        mainBtn.classList.add("active");
        rulerEl.classList.add("hidden");
        mainBtn.setAttribute("data-action", "cancelRuler");
        document.body.classList.add("creating");
        UI.emit("rulerEnabled");
        // machine.transition(machine.value, "switch");
      },
      cancelRuler() {
        mainBtn.classList.remove("active");
        rulerEl.classList.remove("hidden");
        mainBtn.setAttribute("data-action", "enableRuler");
        document.body.classList.remove("creating");
        UI.emit("rulerCanceled");
      },
    },
    transitions: {
      startCreating: {
        target: "creating",
        action() {
          console.log("transition action for 'startCreating' in 'off' state");
        },
      },
      startEditing: {
        target: "editing",
        action() {

        }
      }
    },
  },
  creating: {
    actions: {
      onEnter() {
        console.log("on: onEnter creating");
        mainBtn.classList.remove("add");
        mainBtn.classList.add("accept");
        removeBtn.classList.add("active");
        UI.emit("creating");
      },
      onExit() {
        console.log("on: onExit");
        mainBtn.classList.add("add");
        mainBtn.classList.remove("accept");
        removeBtn.classList.remove("active");
      },
      removeLine(machine) {
        mainBtn.classList.remove("active");
        rulerEl.classList.remove("hidden");
        mainBtn.setAttribute("data-action", "enableRuler");
        document.body.classList.remove("creating");
        machine.transition(machine.value, "stopCreating");
        UI.emit("removeLine");
      },
      cancelRuler(machine) {
        mainBtn.classList.remove("active");
        rulerEl.classList.remove("hidden");
        mainBtn.setAttribute("data-action", "enableRuler");
        document.body.classList.remove("creating");
        machine.transition(machine.value, "stopCreating");
        UI.emit("rulerCanceled");
      },
    },
    transitions: {
      stopCreating: {
        target: "off",
        action() {
          console.log("transition action for 'stopCreating' in 'on' state");
        },
      },
    },
  },
  editing: {
    actions: {
      onEnter() {
        removeBtn.classList.add("active");
        mainBtn.classList.add("disabled");
      },
      onExit() {

      },
      enableRuler(machine) {
        machine.transition(machine.value, "startOff");
      },
      removeLine(machine) {
        mainBtn.classList.remove("active");
        rulerEl.classList.remove("hidden");
        mainBtn.setAttribute("data-action", "enableRuler");
        document.body.classList.remove("creating");
        machine.transition(machine.value, "startOff");
        UI.emit("removeLine");
      },
    },
    transitions: {
      startOff: {
        target: "off",
        action(machine) {
          console.log("transition action for 'startOff' in 'on' state");
          mainBtn.classList.remove("disabled");
          removeBtn.classList.remove("active");
        }
      },
      startCreating: {
        target: "creating",
        action() {
          console.log("transition action for 'startCreating' in 'on' state");
        }
      }
    }
  }
});

document.body.addEventListener("click", (event) => {
  const clicked = event.target.closest("[data-action]");
  const action = clicked && clicked.getAttribute("data-action");
  
  const state = machine.value;
  console.log(state, action);
  machine.action(state, action);
});

document.body.addEventListener("keyup", (event) => {  
  const state = machine.value;
  if (event.key === "Escape") {
    machine.action(state, "cancelRuler");
  }
});

const UI = {
  ...emitter,
  set(action) {
    const state = machine.value;
    machine.transition(state, action);
  },
};

export default UI;