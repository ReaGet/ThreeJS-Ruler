import createMachine from "./stateMachine.js";
import emitter from "./emitter.js";

const uiContentEl = document.querySelector(".ui-content");
const rulerEl = document.querySelector(".ui-btn.ruler");
const addEl = document.querySelector(".ui-btn.add");

const machine = createMachine({
  initialState: "off",
  off: {
    actions: {
      onEnter() {
        console.log("off: onEnter");
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
        machine.transition(machine.value, "switch");
      }
    },
    transitions: {
      switch: {
        target: "creating",
        action() {
          console.log("transition action for 'switch' in 'off' state");
        },
      },
    },
  },
  creating: {
    actions: {
      onEnter() {
        console.log("on: onEnter");
        addEl.classList.add("active");
        rulerEl.classList.add("hidden");
        emitter.emit("creating");
      },
      onExit() {
        console.log("on: onExit");
      },
    },
    transitions: {
      switch: {
        target: "off",
        action() {
          console.log("transition action for 'switch' in 'on' state");
        },
      },
    },
  },
});

document.body.addEventListener("click", (event) => {
  const clicked = event.target.closest("[data-action]");
  const action = clicked && clicked.getAttribute("data-action");
  
  const state = machine.value;
  machine.action(state, action);
});