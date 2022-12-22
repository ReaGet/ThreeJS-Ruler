import createMachine from "./stateMachine.js";
import emitter from "./emitter.js";

const uiContentEl = document.querySelector(".ui-content");
const rulerEl = document.querySelector(".ui-btn.ruler");
const addEl = document.querySelector(".ui-btn.add");

const UI = {
  ...emitter,
};

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
        addEl.classList.add("active");
        rulerEl.classList.add("hidden");
        addEl.setAttribute("data-action", "cancelRuler");
        document.body.classList.add("creating");
        UI.emit("rulerEnabled");
        // machine.transition(machine.value, "switch");
      },
      cancelRuler() {
        addEl.classList.remove("active");
        rulerEl.classList.remove("hidden");
        addEl.setAttribute("data-action", "enableRuler");
        document.body.classList.remove("creating");
        UI.emit("rulerCanceled");
      },
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
        UI.emit("creating");
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

document.body.addEventListener("keyup", (event) => {  
  const state = machine.value;
  if (event.key === "Escape") {
    machine.action(state, "cancelRuler");
  }
});

export default UI;