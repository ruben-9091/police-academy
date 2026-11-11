import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "./split-flap-text.css";

/**
 * SplitFlapText de React Bits, adaptado a este proyecto:
 * - Sin `'use client'` (la app se renderiza en cliente) y con tipado estricto.
 *   Las props conservan los nombres originales para poder seguir el
 *   componente de origen.
 * - La raíz es un `span` en lugar de un `div`: el tablero se usa dentro de un
 *   `h1` y un bloque dentro de un encabezado no sería HTML válido.
 * - El arranque del efecto se difiere un `requestAnimationFrame`. El original
 *   actualiza el estado de forma síncrona dentro del efecto y aquí eso dispara
 *   la regla `react-hooks/set-state-in-effect`, que está en error.
 * - El texto real vive en un `span` solo para lectores de pantalla y las
 *   fichas quedan en `aria-hidden`, así que el tablero se anuncia una única
 *   vez. Con `prefers-reduced-motion` se muestra la frase, sin voltear.
 * - Sin spread de props al DOM: la API es explícita (igual que en
 *   `DecryptedText`).
 */

const DEFAULT_WORDS = ["LAUNCH READY", "SYNC ONLINE", "SIGNAL LIVE"];

const CHARSETS: Record<string, string> = {
  alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  numeric: "0123456789",
};

type Align = "left" | "center" | "right";
type CascadeOrder = "left" | "right" | "center" | "random";
type TileStyle = "board" | "minimal";

interface Tile {
  current: string;
  next: string;
  flipping: boolean;
  tick: number;
}

interface Timing {
  flipMs: number;
  staggerMs: number;
  holdMs: number;
  flips: number;
  glyphs: string;
  order: CascadeOrder;
}

interface FlipPlan {
  index: number;
  target: string;
  sequence: string[];
  start: number;
  step: number;
  done: boolean;
}

interface TileUpdate {
  index: number;
  current: string;
  next: string;
  done: boolean;
}

/** Las variables CSS (`--split-flap-*`) no existen en `CSSProperties`. */
type BoardStyle = CSSProperties & Record<`--${string}`, string | number>;

export interface SplitFlapTextProps {
  /** Frases que se alternan como en un panel de salidas. */
  words?: string[];
  /** Frase única; tiene prioridad sobre `words` y al cambiar voltea el panel. */
  text?: string;
  /** Duración, en segundos, del giro de cada ficha. */
  flipDuration?: number;
  /** Retardo, en segundos, entre el inicio del giro de cada ficha. */
  stagger?: number;
  /** Tiempo, en milisegundos, que se mantiene cada frase antes de pasar a la siguiente. */
  cycleDelay?: number;
  /** Glifos intermedios: `"alpha"`, `"alphanumeric"`, `"numeric"` o un charset propio. */
  charset?: string;
  /** Número de glifos intermedios por cada ficha que cambia. */
  flipsPerChar?: number;
  /** Posición de las frases más cortas que el panel. */
  align?: Align;
  /** Color base de cada ficha mecánica. */
  tileColor?: string;
  /** Color de los glifos; `"currentColor"` hereda el color del texto. */
  textColor?: string;
  /** Radio de las esquinas de cada ficha. */
  tileRadius?: number | string;
  /** Separación entre fichas contiguas. */
  gap?: number | string;
  /** Tamaño de letra de las fichas; un número se interpreta en píxeles. */
  fontSize?: number | string;
  /** Si el repertorio de frases se repite al terminar. */
  loop?: boolean;
  /** Número fijo de fichas para mantener estable el ancho del panel. */
  padTo?: number;
  /** Empieza en blanco y voltea hasta la primera frase al montar. */
  intro?: boolean;
  /** Brillo, de 0 a 1, del reflejo que cae sobre cada ficha al girar. */
  glare?: number;
  /** Sensación física, de 0 (plano) a 1: bisagra, sombreado y grosor. */
  depth?: number;
  /** Desde dónde arranca la cascada del volteo. */
  order?: CascadeOrder;
  /** Fichas mecánicas (`board`) o caracteres sueltos con bisagra (`minimal`). */
  tileStyle?: TileStyle;
  className?: string;
  style?: CSSProperties;
}

const toCssUnit = (value: number | string) =>
  typeof value === "number" ? `${value}px` : value;

const resolveCharset = (charset: string) =>
  CHARSETS[charset] ?? (charset.length > 0 ? charset : CHARSETS.alphanumeric);

const normalizePhrase = (phrase: string, width: number, align: Align = "left") => {
  const safe = String(phrase ?? "").slice(0, width);
  if (align === "right") return safe.padStart(width, " ");
  if (align === "center") {
    return safe
      .padStart(safe.length + Math.floor((width - safe.length) / 2), " ")
      .padEnd(width, " ");
  }
  return safe.padEnd(width, " ");
};

const createTiles = (phrase: string): Tile[] =>
  phrase.split("").map((char) => ({
    current: char,
    next: char,
    flipping: false,
    tick: 0,
  }));

const sampleChar = (charset: string) =>
  charset.charAt(Math.floor(Math.random() * charset.length)) || " ";

const buildSequence = (target: string, flips: number, charset: string) => {
  const steps: string[] = [];
  for (let i = 0; i < flips; i += 1) steps.push(sampleChar(charset));
  steps.push(target);
  return steps;
};

const toGlyph = (char: string) => (char === " " ? "\u00a0" : char);

const shuffleIndices = (count: number) => {
  const list = Array.from({ length: count }, (_, index) => index);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = list[i] ?? i;
    list[i] = list[j] ?? j;
    list[j] = swap;
  }
  return list;
};

const cascadeStep = (
  index: number,
  width: number,
  order: CascadeOrder,
  randomOrder: number[] | null,
) => {
  if (order === "right") return width - 1 - index;
  if (order === "center") return Math.floor(Math.abs(index - (width - 1) / 2));
  if (order === "random" && randomOrder) return randomOrder[index] ?? index;
  return index;
};

const clampUnit = (value: number) => Math.min(1, Math.max(0, Number(value) || 0));

const round = (value: number) => Number(value.toFixed(3));

const getReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(getReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReduced(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReduced;
};

export function SplitFlapText({
  words = DEFAULT_WORDS,
  text,
  flipDuration = 0.12,
  stagger = 0.06,
  cycleDelay = 2400,
  charset = "alphanumeric",
  flipsPerChar = 8,
  tileColor = "#111827",
  textColor = "#f8fafc",
  tileRadius = 8,
  gap = 6,
  fontSize = 52,
  loop = true,
  padTo = 12,
  align = "left",
  intro = true,
  glare = 0,
  depth = 0.5,
  order = "left",
  tileStyle = "board",
  className = "",
  style = {},
}: SplitFlapTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rafRef = useRef<number | null>(null);
  const shownRef = useRef<string | null>(null);
  const fromRef = useRef<string | null>(null);
  const indexRef = useRef(0);
  const phrasesRef = useRef<string[] | null>(null);

  const sourceWords = words.length > 0 ? words : DEFAULT_WORDS;
  const phrasesKey =
    typeof text === "string"
      ? text
      : sourceWords.map((word) => String(word ?? "")).join("\u001f");
  const phrases = useMemo(() => phrasesKey.split("\u001f"), [phrasesKey]);

  const width = useMemo(() => {
    const longest = phrases.reduce(
      (max, phrase) => Math.max(max, phrase.length),
      1,
    );
    return Math.max(1, Math.ceil(Number(padTo) || 0), longest);
  }, [padTo, phrases]);

  const normalizedPhrases = useMemo(
    () => phrases.map((phrase) => normalizePhrase(phrase, width, align)),
    [phrases, width, align],
  );

  const timing = useMemo<Timing>(
    () => ({
      flipMs: Math.max(40, (Number(flipDuration) || 0.12) * 1000),
      staggerMs: Math.max(0, (Number(stagger) || 0) * 1000),
      holdMs: Math.max(400, Number(cycleDelay) || 2400),
      flips: Math.max(0, Math.floor(Number(flipsPerChar) || 0)),
      glyphs: resolveCharset(charset),
      order,
    }),
    [flipDuration, stagger, cycleDelay, flipsPerChar, charset, order],
  );
  const timingRef = useRef(timing);

  const [tiles, setTiles] = useState<Tile[]>(() =>
    createTiles(intro ? " ".repeat(width) : (normalizedPhrases[0] ?? "")),
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    timingRef.current = timing;
  }, [timing]);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let startFrame = 0;

    const stopFrame = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const animateTo = (target: string): number => {
      const { flipMs, staggerMs, flips, glyphs, order: cascade } =
        timingRef.current;
      const from = normalizePhrase(shownRef.current ?? target, target.length);
      const randomOrder =
        cascade === "random" ? shuffleIndices(target.length) : null;

      stopFrame();
      shownRef.current = target;
      fromRef.current = null;

      const plans: FlipPlan[] = [];
      if (!prefersReducedMotion) {
        for (let index = 0; index < target.length; index += 1) {
          if (from[index] === target[index]) continue;
          plans.push({
            index,
            target: target[index],
            sequence: buildSequence(target[index], flips, glyphs),
            start:
              cascadeStep(index, target.length, cascade, randomOrder) *
              staggerMs,
            step: -1,
            done: false,
          });
        }
      }

      if (plans.length === 0) {
        setTiles(createTiles(target));
        return 0;
      }

      fromRef.current = from;
      setTiles(createTiles(from));

      const totalDuration = plans.reduce(
        (max, plan) =>
          Math.max(max, plan.start + plan.sequence.length * flipMs),
        0,
      );
      const startedAt = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;

        const elapsed = now - startedAt;
        const updates: TileUpdate[] = [];
        let running = false;

        plans.forEach((plan) => {
          const localElapsed = elapsed - plan.start;

          if (localElapsed < 0) {
            running = true;
            return;
          }

          const step = Math.floor(localElapsed / flipMs);

          if (step < plan.sequence.length) {
            running = true;

            if (step !== plan.step) {
              plan.step = step;
              updates.push({
                index: plan.index,
                current: step === 0 ? from[plan.index] : plan.sequence[step - 1],
                next: plan.sequence[step],
                done: false,
              });
            }
          } else if (!plan.done) {
            plan.done = true;
            updates.push({
              index: plan.index,
              current: plan.target,
              next: plan.target,
              done: true,
            });
          }
        });

        if (updates.length > 0) {
          setTiles((previous) => {
            const nextTiles = [...previous];
            updates.forEach((update) => {
              const tile = nextTiles[update.index];
              if (!tile) return;

              nextTiles[update.index] = {
                current: update.current,
                next: update.next,
                flipping: !update.done,
                tick: tile.tick + 1,
              };
            });
            return nextTiles;
          });
        }

        if (running) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          fromRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(tick);
      return totalDuration;
    };

    const show = (index: number) => {
      indexRef.current = index;
      setActiveIndex(index);
      return animateTo(normalizedPhrases[index] ?? "");
    };

    const scheduleNext = (delay: number) => {
      timer = window.setTimeout(() => {
        if (cancelled) return;

        if (document.hidden) {
          scheduleNext(timingRef.current.holdMs);
          return;
        }

        const nextIndex = indexRef.current + 1;
        if (nextIndex >= normalizedPhrases.length && !loop) return;

        const duration = show(nextIndex % normalizedPhrases.length);
        scheduleNext(timingRef.current.holdMs + duration);
      }, delay);
    };

    /** El estado solo se actualiza desde callbacks, nunca en el efecto. */
    const start = () => {
      const samePhrases = phrasesRef.current === normalizedPhrases;
      phrasesRef.current = normalizedPhrases;

      if (shownRef.current === null) {
        shownRef.current = intro
          ? " ".repeat(width)
          : (normalizedPhrases[0] ?? "");
      }

      if (!samePhrases || indexRef.current >= normalizedPhrases.length) {
        indexRef.current = 0;
      } else if (fromRef.current !== null) {
        shownRef.current = fromRef.current;
      }

      const currentPhrase = normalizedPhrases[indexRef.current] ?? "";
      let startDuration = 0;

      if (shownRef.current === currentPhrase) {
        stopFrame();
        fromRef.current = null;
        setActiveIndex(indexRef.current);
        setTiles(createTiles(currentPhrase));
      } else {
        startDuration = show(indexRef.current);
      }

      if (normalizedPhrases.length > 1) {
        scheduleNext(timingRef.current.holdMs + startDuration);
      }
    };

    startFrame = requestAnimationFrame(() => {
      startFrame = 0;
      if (cancelled) return;
      start();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (startFrame !== 0) cancelAnimationFrame(startFrame);
      stopFrame();
    };
  }, [normalizedPhrases, width, loop, intro, prefersReducedMotion]);

  const label = String(phrases[activeIndex] ?? phrases[0] ?? "").trim();
  const minimal = tileStyle === "minimal";
  const level = clampUnit(depth);
  const flat = Math.min(1, level * 2);
  const deep = Math.max(0, level - 0.5) * 2;
  const sheen = minimal ? 0 : clampUnit(glare);
  const shaded = !minimal && deep > 0;
  const rootClass = [
    "split-flap-text",
    minimal && "split-flap-text--minimal",
    sheen > 0 && "split-flap-text--glare",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const boardStyle: BoardStyle = {
    "--split-flap-tile-color": tileColor,
    "--split-flap-text-color": textColor,
    "--split-flap-radius": toCssUnit(tileRadius),
    "--split-flap-gap": toCssUnit(gap),
    "--split-flap-font-size": toCssUnit(fontSize),
    "--split-flap-flip-duration": `${Math.max(0.04, Number(flipDuration) || 0.12)}s`,
    "--split-flap-front-from": round(1 + 0.08 * flat),
    "--split-flap-front-to": round(1 - 0.48 * flat - 0.3 * deep),
    "--split-flap-back-from": round(1 - 0.42 * flat - 0.3 * deep),
    "--split-flap-hinge": `calc(1px + ${round(deep * 0.05)}em)`,
    "--split-flap-hinge-shade": round(0.25 + 0.39 * flat + 0.21 * deep),
    "--split-flap-drop": round(0.28 * flat + 0.2 * deep),
    "--split-flap-lift": round(0.4 + 0.6 * flat + 0.7 * deep),
    "--split-flap-cast": round(deep * 0.62),
    "--split-flap-edge": `${round(deep * 0.035)}em`,
    "--split-flap-split": `${round(0.015 + level * 0.06)}em`,
    "--split-flap-glare": round(sheen * 0.55),
    ...style,
  };

  return (
    <span className={rootClass} style={boardStyle}>
      <span className="split-flap-text__sr">{label}</span>
      {tiles.map((tile, index) => (
        <span
          className={`split-flap-text__tile${tile.flipping ? " is-flipping" : ""}`}
          aria-hidden="true"
          key={`${index}-${tiles.length}`}
        >
          <span
            className="split-flap-text__half split-flap-text__half--top"
            key={minimal ? `top-${tile.tick}` : "top"}
          >
            <span className="split-flap-text__char">
              {toGlyph(tile.flipping ? tile.next : tile.current)}
            </span>
          </span>
          <span
            className="split-flap-text__half split-flap-text__half--bottom"
            key={minimal ? `bottom-${tile.tick}` : "bottom"}
          >
            <span className="split-flap-text__char">
              {toGlyph(tile.current)}
            </span>
          </span>

          {tile.flipping && (
            <>
              {shaded && (
                <>
                  <span
                    className="split-flap-text__shade split-flap-text__shade--top"
                    key={`shade-top-${tile.tick}`}
                  />
                  <span
                    className="split-flap-text__shade split-flap-text__shade--bottom"
                    key={`shade-bottom-${tile.tick}`}
                  />
                </>
              )}
              <span
                className="split-flap-text__flap split-flap-text__flap--front"
                key={`front-${index}-${tile.tick}`}
              >
                <span className="split-flap-text__char">
                  {toGlyph(tile.current)}
                </span>
              </span>
              <span
                className="split-flap-text__flap split-flap-text__flap--back"
                key={`back-${index}-${tile.tick}`}
              >
                <span className="split-flap-text__char">
                  {toGlyph(tile.next)}
                </span>
              </span>
            </>
          )}
        </span>
      ))}
    </span>
  );
}

export default SplitFlapText;
