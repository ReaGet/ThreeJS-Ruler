import * as THREE from "three";

export default function(scene_) {
  const scene = scene_;
  const lines = [];
  let state = "";
  let current = {
    indicator: null,
    selected: null,
    points: [],
    lines: [],
  };

  function createPoint(point_) {
    const pointGeometry = new THREE.SphereGeometry(5, 32, 16);
    const pointMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    const point = new THREE.Mesh(pointGeometry, pointMaterial);

    point.userData.dot = true;
    point.position.copy(point_);
    current.points.push(point);
    
    scene.add(point);
  }

  function createLine(a, b) {
    const points = [a, (b || a)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75,
      })
    );
    scene.add(line);
    return line;
  }

  function handleLines() {
    if (current.points.length < 2) { return; }

    removeLines();

    for (let i = 0; i < current.points.length - 1; i++) {
      const line = createLine(
        current.points[i].position,
        current.points[i + 1].position
      );
      current.lines.push(line);
    }  
  }

  function removeLines() {
    for (let i = 0; i < current.lines.length; i++) {
      const line = current.lines[i];
      scene.remove(line);
      current.lines.splice(i, 1);
      i--;
    }
  }

  function removePoint(uuid) {
    for (let i = 0; i < current.points.length; i++) {
      const point = current.points[i];
      if (point.uuid === uuid) {
        scene.remove(point);
        current.points.splice(i, 1);
        i--;
      }
    }
  }

  function finishStructure() {
    if (current.points.length < 2) {
      current.points.forEach((point) => scene.remove(point));
    }

    const line = {};
    line.points = current.points;
    line.lines = current.lines;

    lines.push(line);
  }

  function resetCurrent() {
    current.selected = null;
    current.points = [];
    current.lines = [];
  }

  function updateIndicator(point) {
    const prevPoint = current.points[current.points.length - 1];
    const positions = current.indicator.geometry.attributes.position.array;
    positions[0] = prevPoint.position.x;
    positions[1] = prevPoint.position.y;
    positions[2] = prevPoint.position.z;
    positions[3] = point.x;
    positions[4] = point.y;
    positions[5] = point.z;
    current.indicator.geometry.attributes.position.needsUpdate = true;
  }

  function removeIndicator() {
    if (!current.indicator) { return; }
    scene.remove(current.indicator);
    current.indicator = null;
  }

  const ruler = {
    addPoint(intersaction) {
      const point = intersaction?.point;
      if (state === "selected") {
        this.diselect();
        return;
      }
      if (!point) { return; }
      state = "enabled";

      createPoint(point);
      if (!current.indicator) {
        current.indicator = createLine(point);
      }
      handleLines();
    },
    update(intersaction) {
      const point = intersaction?.point;
      if (state !== "enabled" || !point) { return; }
      updateIndicator(point);
    },
    cancel() {
      finishStructure();
      removeIndicator();
      this.diselect();
      resetCurrent();
      state = "";
    },
    diselect() {
      current.selected && current.selected.material.color.set(0xffffff);
    },
    select(intersaction) {
      this.diselect();
      if (state === "enabled") { return; }
      state = "selected";
      current = lines.filter((line) => {
        return line.points.find((point) => {
          return point.uuid === intersaction.object.uuid;
        });
      }).at(0);
      current.selected = intersaction.object;
      current.selected.material.color.set(0xff0000);
      // removePoint(uuid);
      // handleLines();
      // finishStructure();
    },
    isRuler(intersaction) {
      return intersaction.object.userData.dot === true;
    }
  };

  setInterval(() => console.log(state), 1000);

  return ruler;
};
