"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  CircleDot,
  MoveRight,
  ScanSearch,
  Sparkles,
  Waypoints,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CubeColor = "white" | "yellow" | "red" | "orange" | "blue" | "green";
type FaceId = "front" | "right" | "back" | "left" | "up" | "down";

type FaceConfig = {
  id: FaceId;
  label: string;
  hint: string;
  center: CubeColor;
  status: "Ready" | "Pending";
  confidence: number;
};

const colorCycle: CubeColor[] = ["white", "yellow", "red", "orange", "blue", "green"];

const colorMap: Record<
  CubeColor,
  { fill: string; border: string; text: string; label: string }
> = {
  white: {
    fill: "#fff8e7",
    border: "#d1c7af",
    text: "#6b5b3d",
    label: "White",
  },
  yellow: {
    fill: "#facc15",
    border: "#ca8a04",
    text: "#854d0e",
    label: "Yellow",
  },
  red: {
    fill: "#ef4444",
    border: "#b91c1c",
    text: "#7f1d1d",
    label: "Red",
  },
  orange: {
    fill: "#fb923c",
    border: "#c2410c",
    text: "#9a3412",
    label: "Orange",
  },
  blue: {
    fill: "#3b82f6",
    border: "#1d4ed8",
    text: "#1e3a8a",
    label: "Blue",
  },
  green: {
    fill: "#22c55e",
    border: "#15803d",
    text: "#166534",
    label: "Green",
  },
};

const faces: FaceConfig[] = [
  {
    id: "front",
    label: "Front",
    hint: "Green center facing you",
    center: "green",
    status: "Ready",
    confidence: 98,
  },
  {
    id: "right",
    label: "Right",
    hint: "Red center on the right",
    center: "red",
    status: "Ready",
    confidence: 95,
  },
  {
    id: "back",
    label: "Back",
    hint: "Blue center opposite front",
    center: "blue",
    status: "Ready",
    confidence: 93,
  },
  {
    id: "left",
    label: "Left",
    hint: "Orange center on the left",
    center: "orange",
    status: "Ready",
    confidence: 94,
  },
  {
    id: "up",
    label: "Up",
    hint: "White center on top",
    center: "white",
    status: "Pending",
    confidence: 0,
  },
  {
    id: "down",
    label: "Down",
    hint: "Yellow center on bottom",
    center: "yellow",
    status: "Pending",
    confidence: 0,
  },
];

const initialFaceState: Record<FaceId, CubeColor[]> = {
  front: [
    "green",
    "green",
    "white",
    "red",
    "green",
    "green",
    "green",
    "yellow",
    "green",
  ],
  right: ["red", "red", "red", "green", "red", "white", "red", "red", "red"],
  back: ["blue", "yellow", "blue", "blue", "blue", "blue", "orange", "blue", "blue"],
  left: [
    "orange",
    "orange",
    "orange",
    "orange",
    "orange",
    "green",
    "orange",
    "orange",
    "orange",
  ],
  up: ["white", "white", "white", "white", "white", "white", "white", "white", "white"],
  down: [
    "yellow",
    "yellow",
    "yellow",
    "yellow",
    "yellow",
    "yellow",
    "yellow",
    "yellow",
    "yellow",
  ],
};

const pipeline = [
  {
    title: "Capture each face",
    description: "Take six guided photos and keep the center sticker aligned.",
    icon: Camera,
  },
  {
    title: "Review colors",
    description: "Check the detected stickers and tap any square that needs correction.",
    icon: ScanSearch,
  },
  {
    title: "Follow the solve",
    description: "See the best solve path, alternate routes, and the next move to make.",
    icon: Waypoints,
  },
];

const methodPreview = [
  {
    title: "Fastest search window",
    turns: "20-22 turns",
    note: "Cube.js / Kociemba style shortest-path search once backend is wired.",
  },
  {
    title: "Human-friendly solve",
    turns: "4 guided phases",
    note: "Layer-by-layer hints with move groups the user can follow manually.",
  },
  {
    title: "Equivalent solution families",
    turns: "18 candidate branches",
    note: "Symmetry and alternate first-cross choices exposed as an insight panel.",
  },
];

const scanTips = [
  "Keep the full face inside the guide before taking the photo.",
  "Use even lighting so the white and yellow stickers stay distinct.",
  "If a sticker looks wrong, tap the square and cycle to the correct color.",
];

const nextMoves = [
  "R U R' U'",
  "F R U R' U' F'",
  "U R U' L' U R' U' L",
];

function getNextColor(color: CubeColor) {
  const index = colorCycle.indexOf(color);
  return colorCycle[(index + 1) % colorCycle.length];
}

function faceCompletion(faceId: FaceId, stickers: CubeColor[]) {
  const center = initialFaceState[faceId][4];
  const matches = stickers.filter((sticker) => sticker === center).length;
  return Math.round((matches / stickers.length) * 100);
}

export function RubixHome() {
  const [selectedFace, setSelectedFace] = useState<FaceId>("front");
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [faceState, setFaceState] =
    useState<Record<FaceId, CubeColor[]>>(initialFaceState);

  const activeFace = faces.find((face) => face.id === selectedFace) ?? faces[0];
  const completedFaces = faces.filter((face) => face.status === "Ready").length;

  const liveMetrics = useMemo(() => {
    const activeCompletion = faceCompletion(selectedFace, faceState[selectedFace]);
    return {
      facesReady: completedFaces,
      confidence:
        activeFace.status === "Ready"
          ? `${Math.max(activeFace.confidence, activeCompletion)}%`
          : "Awaiting scan",
      solutionFamilies: 18 + Math.max(0, Math.floor((activeCompletion - 70) / 5)),
    };
  }, [activeFace.confidence, activeFace.status, completedFaces, faceState, selectedFace]);

  const handleStickerClick = (index: number) => {
    if (index === 4) {
      return;
    }

    setFaceState((current) => ({
      ...current,
      [selectedFace]: current[selectedFace].map((sticker, stickerIndex) =>
        stickerIndex === index ? getNextColor(sticker) : sticker,
      ),
    }));
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="texture-grid absolute inset-0 opacity-35" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/55 px-5 py-4 shadow-[0_16px_50px_rgba(17,24,39,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#111827] text-sm font-bold tracking-[0.3em] text-[#f8fafc]">
              RC
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Rubix Cube
              </p>
              <h1 className="text-xl font-semibold">AI-guided cube scanning and solving</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Smart scan</Badge>
            <Button variant="secondary">Open guide</Button>
            <Button>
              Start capture
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-0 bg-[#111827] text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
            <CardContent className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="space-y-6">
                <Badge variant="accent" className="border-0 bg-white/10 text-orange-200">
                  Scan. Check. Solve.
                </Badge>
                <div className="space-y-4">
                  <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                    Snap your cube, confirm the colors, and get the clearest path to solve it.
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                    The experience is built around one job: help the user scan a real cube,
                    fix any color mistakes quickly, and move from confusion to a solvable state
                    without needing cube notation knowledge.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-white text-[#111827] hover:bg-white/90">
                    Start with front face
                    <MoveRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    See scan tips
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {pipeline.map(({ title, description, icon: Icon }, index) => (
                  <div
                    key={title}
                    className="rounded-[24px] border border-white/10 bg-white/6 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
                        <Icon className="size-5 text-orange-200" />
                      </div>
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            <MetricCard
              label="Faces captured"
              value={`${liveMetrics.facesReady}/6`}
              note="Four sides are flagged ready in this prototype state."
              icon={CheckCircle2}
            />
            <MetricCard
              label="Vision confidence"
              value={liveMetrics.confidence}
              note="Confidence rises after manual sticker correction."
              icon={Sparkles}
            />
            <MetricCard
              label="Possible solve branches"
              value={`${liveMetrics.solutionFamilies}`}
              note="Preview count for alternative solution families."
              icon={Waypoints}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Capture Queue</CardTitle>
                  <CardDescription>
                    Guided face-by-face flow for image upload and review.
                  </CardDescription>
                </div>
                <Badge>{mode === "camera" ? "Camera mode" : "Manual mode"}</Badge>
              </div>

              <div className="flex gap-2 rounded-full border border-border bg-white/70 p-1">
                <button
                  className={cn(
                    "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    mode === "camera"
                      ? "bg-[#111827] text-white"
                      : "text-muted-foreground",
                  )}
                  onClick={() => setMode("camera")}
                  type="button"
                >
                  Camera capture
                </button>
                <button
                  className={cn(
                    "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    mode === "manual"
                      ? "bg-[#111827] text-white"
                      : "text-muted-foreground",
                  )}
                  onClick={() => setMode("manual")}
                  type="button"
                >
                  Manual review
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {faces.map((face) => {
                const isSelected = face.id === selectedFace;

                return (
                  <button
                    key={face.id}
                    className={cn(
                      "w-full rounded-[24px] border px-4 py-4 text-left transition-all",
                      isSelected
                        ? "border-[#111827] bg-[#111827] text-white shadow-[0_18px_40px_rgba(17,24,39,0.16)]"
                        : "border-border bg-white/70 hover:-translate-y-0.5 hover:bg-white",
                    )}
                    onClick={() => setSelectedFace(face.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold">{face.label}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em]",
                              face.status === "Ready"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : "bg-amber-500/15 text-amber-700",
                            )}
                          >
                            {face.status}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-1 text-sm leading-6",
                            isSelected ? "text-slate-300" : "text-muted-foreground",
                          )}
                        >
                          {face.hint}
                        </p>
                      </div>

                      <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                        <Camera className={cn("size-4", isSelected ? "text-orange-200" : "text-primary")} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className={isSelected ? "text-slate-300" : "text-muted-foreground"}>
                        {face.status === "Ready"
                          ? `${face.confidence}% AI confidence`
                          : "Not uploaded yet"}
                      </span>
                      <span className="font-medium">
                        {face.status === "Ready" ? "Retake" : "Upload"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
            <CardFooter className="flex-col items-start gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Move face by face. When all six sides are captured, the solve panel becomes
                the main workspace.
              </p>
              <Button variant="secondary">Continue capture</Button>
            </CardFooter>
          </Card>

          <Card className="border-[#111827]/10 bg-white/80">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{activeFace.label} Face Calibration</CardTitle>
                  <CardDescription>
                    Tap any non-center sticker to simulate correcting the AI detection result.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{colorMap[activeFace.center].label} center</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[30px] border border-border bg-[#f8f6ef] p-5">
                  <div className="mx-auto grid max-w-[300px] grid-cols-3 gap-3">
                    {faceState[selectedFace].map((sticker, index) => {
                      const color = colorMap[sticker];

                      return (
                        <button
                          key={`${selectedFace}-${index}`}
                          type="button"
                          onClick={() => handleStickerClick(index)}
                          disabled={index === 4}
                          className={cn(
                            "aspect-square rounded-[22px] border-2 shadow-[inset_0_-10px_18px_rgba(255,255,255,0.18)] transition-transform",
                            index === 4
                              ? "cursor-not-allowed"
                              : "cursor-pointer hover:-translate-y-0.5",
                          )}
                          style={{
                            backgroundColor: color.fill,
                            borderColor: color.border,
                          }}
                          aria-label={`${color.label} sticker ${index + 1}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[24px] border border-border bg-[#fffdf8] p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                      Active review
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {faceCompletion(selectedFace, faceState[selectedFace])}%
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Matching stickers against the expected {colorMap[activeFace.center].label.toLowerCase()} face center.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                      Legend
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {colorCycle.map((colorKey) => {
                        const color = colorMap[colorKey];

                        return (
                          <div
                            key={colorKey}
                            className="flex items-center gap-2 rounded-2xl border border-border bg-[#fcfbf7] px-3 py-2"
                          >
                            <span
                              className="size-4 rounded-full border"
                              style={{
                                backgroundColor: color.fill,
                                borderColor: color.border,
                              }}
                            />
                            <span className="text-sm font-medium">{color.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-dashed border-border bg-white/60 p-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Use this review step to clean up any sticker the camera read incorrectly
                      before starting the solve.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solver Preview</CardTitle>
              <CardDescription>
                A user-facing summary of the best solving options for the scanned cube.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {methodPreview.map((method) => (
                <div
                  key={method.title}
                  className="rounded-[24px] border border-border bg-white/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{method.title}</p>
                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      <CircleDot className="size-3.5" />
                      {method.turns}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{method.note}</p>
                </div>
              ))}

              <div className="rounded-[28px] border border-[#111827] bg-[#111827] p-5 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Next move sequence
                </p>
                <div className="mt-4 space-y-3 font-mono text-sm text-slate-200">
                  {nextMoves.map((move) => (
                    <p key={move}>{move}</p>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-3">
              <Button className="w-full sm:w-auto">
                Start solving
              </Button>
              <p className="text-sm leading-6 text-muted-foreground">
                The app should help the user choose between the quickest path and the easiest
                path to follow by hand.
              </p>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Capture Tips</CardTitle>
              <CardDescription>
                Keep the scan clean so the cube state is easy to verify.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanTips.map((tip, index) => (
                <div
                  key={tip}
                  className="flex gap-4 rounded-[22px] border border-border bg-white/70 p-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#111827] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ready To Solve</CardTitle>
              <CardDescription>
                A quick summary before the user starts the guided solve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[24px] border border-border bg-white/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Scan status
                </p>
                <p className="mt-2 text-3xl font-semibold">{liveMetrics.facesReady}/6 faces</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Finish the remaining faces to unlock the full guided solve.
                </p>
              </div>

              <div className="rounded-[24px] border border-border bg-white/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Selected face
                </p>
                <p className="mt-2 text-2xl font-semibold">{activeFace.label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {activeFace.hint}
                </p>
              </div>

              <div className="rounded-[24px] border border-border bg-white/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Solve confidence
                </p>
                <p className="mt-2 text-2xl font-semibold">{liveMetrics.confidence}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Higher confidence means fewer sticker corrections are likely needed.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <Card className="bg-white/80">
      <CardContent className="flex h-full flex-col gap-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
