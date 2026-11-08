import Phaser from "phaser";

export type MinigameResult = "win" | "lose";

export interface LilyPadHopConfig {
  onComplete: (result: MinigameResult) => void;
}

export class LilyPadHopScene extends Phaser.Scene {
  private onComplete!: (result: MinigameResult) => void;
  private duck!: Phaser.GameObjects.Arc;
  private pads: Phaser.GameObjects.Ellipse[] = [];
  private currentPad = 0;
  private finished = false;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super("LilyPadHop");
  }

  init(data: LilyPadHopConfig) {
    this.onComplete = data.onComplete;
  }

  create() {
    const { width, height } = this.scale;
    this.finished = false;
    this.currentPad = 0;
    this.pads = [];

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a4a5a);
    for (let i = 0; i < 6; i++) {
      this.add
        .rectangle(width / 2, 40 + i * 55, width, 2, 0x7ec8c8, 0.15)
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, 28, "Lily Pad Hop", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "28px",
        color: "#F2DFB3",
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, 58, "Click the next pad in order — miss and you splash!", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "14px",
        color: "#F2DFB3",
      })
      .setOrigin(0.5);

    const padCount = 5;
    const startX = width * 0.15;
    const endX = width * 0.85;
    const midY = height * 0.55;

    for (let i = 0; i < padCount; i++) {
      const t = i / (padCount - 1);
      const x = startX + (endX - startX) * t;
      const y = midY + Math.sin(t * Math.PI) * -40 + (i % 2 === 0 ? 10 : -10);
      const pad = this.add
        .ellipse(x, y, 70, 36, 0x4a7c59)
        .setStrokeStyle(3, 0x2d5a3a)
        .setInteractive({ useHandCursor: true });
      pad.on("pointerdown", () => this.tryHop(i));
      pad.on("pointerover", () => {
        if (!this.finished) pad.setFillStyle(0x5a9c69);
      });
      pad.on("pointerout", () => {
        if (!this.finished) pad.setFillStyle(0x4a7c59);
      });
      this.pads.push(pad);
      this.add
        .text(x, y, `${i + 1}`, {
          fontFamily: "Fredoka, sans-serif",
          fontSize: "16px",
          color: "#F2DFB3",
        })
        .setOrigin(0.5);
    }

    const first = this.pads[0];
    this.duck = this.add.circle(first.x, first.y - 28, 16, 0xf5e6c8);
    this.add.circle(first.x + 10, first.y - 26, 5, 0xffa040);

    this.add
      .text(width / 2, height - 36, "Start on pad 1 — hop to pad 5", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "13px",
        color: "#F2DFB3",
      })
      .setOrigin(0.5);
  }

  private tryHop(index: number) {
    if (this.finished) return;
    if (index === this.currentPad) return;

    if (index !== this.currentPad + 1) {
      this.lose();
      return;
    }

    this.currentPad = index;
    const pad = this.pads[index];
    this.tweens.add({
      targets: this.duck,
      x: pad.x,
      y: pad.y - 28,
      duration: 220,
      ease: "Sine.easeOut",
    });

    if (index === this.pads.length - 1) {
      this.win();
    } else {
      this.statusText.setText(`Hopped to pad ${index + 1}!`);
    }
  }

  private win() {
    this.finished = true;
    this.statusText.setText("You made it across!");
    this.statusText.setColor("#F2DFB3");
    this.time.delayedCall(700, () => this.onComplete("win"));
  }

  private lose() {
    this.finished = true;
    this.statusText.setText("Splash! Back to choices…");
    this.statusText.setColor("#F2DFB3");
    this.tweens.add({
      targets: this.duck,
      y: this.duck.y + 80,
      alpha: 0.2,
      duration: 400,
    });
    this.time.delayedCall(900, () => this.onComplete("lose"));
  }
}

export function createLilyPadHopGame(
  parent: HTMLElement,
  onComplete: (result: MinigameResult) => void
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 640,
    height: 400,
    backgroundColor: "#1a4a5a",
    scene: [],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
  game.scene.add("LilyPadHop", LilyPadHopScene, true, { onComplete });
  return game;
}
